import User from '../models/User.js';
import MicrosoftIntegration from '../models/MicrosoftIntegration.js';
import { generateToken } from '../utils/generateToken.js';
import { generateResetToken } from '../utils/generateResetToken.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../utils/emailService.js';
import crypto from 'crypto';

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
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
      password,
      role: role || 'developer',
      department: department || null,
      resetPasswordToken: hashedToken,
      resetPasswordExpire,
    });

    const token = generateToken(user._id);

    // Auto-create Microsoft Integration with default settings
    try {
      await MicrosoftIntegration.create({
        userId: user._id,
        integrationType: 'outlook', // Default to outlook, can be changed later
        outlook: {
          isConnected: false, // Will be connected when user authenticates
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
      // Don't fail registration if integration creation fails
    }

    // Send welcome email with password reset link (don't block registration if email fails)
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
      token,
      message: 'Registration successful. Please check your email to set your password.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Lowercase email for consistent lookup (emails are stored lowercase)
    const normalizedEmail = email.toLowerCase();
    
    const user = await User.findOne({ email: normalizedEmail });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        department: user.department,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    // Log error without exposing sensitive details
    if (process.env.NODE_ENV !== 'production') {
      console.error('Login error:', error);
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists for security
      return res.json({ 
        message: 'If that email exists, a password reset link has been sent.' 
      });
    }

    // Generate reset token
    const { resetToken, hashedToken } = generateResetToken();
    const resetPasswordExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = resetPasswordExpire;
    await user.save({ validateBeforeSave: false });

    try {
      await sendPasswordResetEmail(user, resetToken);
      
      res.json({ 
        message: 'Password reset email sent. Please check your inbox.' 
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      
      return res.status(500).json({ 
        message: 'Email could not be sent. Please try again later.' 
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash the token to compare with stored token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const authToken = generateToken(user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      department: user.department,
      token: authToken,
      message: 'Password reset successful',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

