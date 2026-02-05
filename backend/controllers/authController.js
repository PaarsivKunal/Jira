import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Lowercase email for consistent lookup
    const normalizedEmail = email.toLowerCase();

    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: role || 'developer',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token,
      message: 'Registration successful',
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
    
    // Debug logging (remove in production)
    console.log('Login attempt:', { 
      originalEmail: email, 
      normalizedEmail,
      hasPassword: !!password 
    });
    
    const user = await User.findOne({ email: normalizedEmail });
    
    // Debug logging
    console.log('User found:', !!user);
    if (user) {
      console.log('User email in DB:', user.email);
      const passwordMatch = await user.matchPassword(password);
      console.log('Password match:', passwordMatch);
    } else {
      console.log('No user found with email:', normalizedEmail);
      // Check if user exists with different casing
      const userAnyCase = await User.findOne({ 
        email: { $regex: new RegExp(`^${email}$`, 'i') } 
      });
      if (userAnyCase) {
        console.log('User found with different casing:', userAnyCase.email);
      }
    }

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
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

