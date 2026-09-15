const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// =============================================
// IN-MEMORY FALLBACK STORE (when MongoDB is offline)
// =============================================
const inMemoryUsers = new Map();

function isDbConnected(req) {
  return req.app.locals.dbConnected === true;
}

// Share in-memory store with middleware via app.locals
router.use((req, res, next) => {
  if (!req.app.locals.inMemoryUsers) {
    req.app.locals.inMemoryUsers = inMemoryUsers;
  }
  next();
});

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'finly_secret_key', {
    expiresIn: '30d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, currency } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (isDbConnected(req)) {
      // ---- MongoDB Path ----
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists'
        });
      }

      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        currency: currency || 'INR'
      });

      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency
        }
      });
    } else {
      // ---- In-Memory Fallback Path ----
      if (inMemoryUsers.has(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists'
        });
      }

      const id = 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      const user = {
        _id: id,
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        currency: currency || 'INR',
        createdAt: new Date().toISOString()
      };

      inMemoryUsers.set(normalizedEmail, user);

      const token = generateToken(id);

      res.status(201).json({
        success: true,
        message: 'Account created successfully (in-memory mode)',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency
        }
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isDbConnected(req)) {
      // ---- MongoDB Path ----
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const token = generateToken(user._id);

      res.json({
        success: true,
        message: 'Logged in successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency
        }
      });
    } else {
      // ---- In-Memory Fallback Path ----
      const user = inMemoryUsers.get(normalizedEmail);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const token = generateToken(user._id);

      res.json({
        success: true,
        message: 'Logged in successfully (in-memory mode)',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency
        }
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Me route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving user profile'
    });
  }
});

module.exports = router;
