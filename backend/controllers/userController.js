import User from '../models/User.js';
import MicrosoftIntegration from '../models/MicrosoftIntegration.js';
import { generateResetToken } from '../utils/generateResetToken.js';
import { sendWelcomeEmail } from '../utils/emailService.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private
export const getUsers = async (req, res) => {
  try {
    const { department, role } = req.query;
    const query = {};

    // Filter by department if provided
    if (department) {
      query.department = department;
    }

    // Filter by role if provided
    if (role) {
      query.role = role;
    }

    const users = await User.find(query).select('-password').sort({ name: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new user (Admin only)
// @route   POST /api/users
// @access  Private/Admin
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    // Lowercase email for consistent lookup
    const normalizedEmail = email.toLowerCase();

    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate password reset token for welcome email
    const { resetToken, hashedToken } = generateResetToken();
    const resetPasswordExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: password || 'TempPassword123!', // Default password if not provided
      role: role || 'developer',
      department: department || null,
      resetPasswordToken: hashedToken,
      resetPasswordExpire,
      mustChangePassword: true, // Require password change on first login
    });

    // Auto-create Microsoft Integration with default settings
    try {
      await MicrosoftIntegration.create({
        userId: user._id,
        integrationType: 'outlook',
        outlook: {
          isConnected: false,
          email: normalizedEmail,
        },
        settings: {
          sendEmailNotifications: true,
          sendTeamsNotifications: true,
          notifyOnIssueCreate: true,
          notifyOnIssueUpdate: true,
          notifyOnComment: true,
          notifyOnStatusChange: true,
          notifyOnAssignment: true,
        },
      });
    } catch (integrationError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to create Microsoft Integration:', integrationError);
      }
    }

    // Send welcome email with password reset link
    sendWelcomeEmail(user, resetToken).catch((error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to send welcome email:', error);
      }
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      department: user.department,
      message: 'User created successfully. Welcome email sent.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const { name, email, role, department, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email.toLowerCase();
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (department !== undefined) user.department = department;
    if (password) user.password = password; // Will be hashed by pre-save hook

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      department: user.department,
      message: 'User updated successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Delete associated Microsoft Integration
    try {
      await MicrosoftIntegration.findOneAndDelete({ userId: user._id });
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to delete Microsoft Integration:', error);
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

