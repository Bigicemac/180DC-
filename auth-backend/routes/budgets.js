const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { Budget, inMemoryBudgets } = require('../models/Budget');

// GET /api/budgets - Get user's budgets
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (req.app.locals.dbConnected) {
      const budgets = await Budget.find({ user: userId });
      return res.json({ success: true, count: budgets.length, data: budgets });
    }

    const userBudgets = inMemoryBudgets.filter(b => b.userId === userId || b.userId === 'guest');
    return res.json({ success: true, count: userBudgets.length, data: userBudgets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/budgets - Set or update budget limit for a category
router.post('/', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { category, limit } = req.body;

    if (!category || limit === undefined) {
      return res.status(400).json({ success: false, message: 'Category and limit are required' });
    }

    if (req.app.locals.dbConnected) {
      const budget = await Budget.findOneAndUpdate(
        { user: userId, category },
        { limit: Number(limit) },
        { new: true, upsert: true }
      );
      return res.status(201).json({ success: true, data: budget });
    }

    // In-memory fallback
    const existing = inMemoryBudgets.find(b => (b.userId === userId || b.userId === 'guest') && b.category.toLowerCase() === category.toLowerCase());
    if (existing) {
      existing.limit = Number(limit);
      return res.json({ success: true, data: existing });
    }

    const newBudget = {
      _id: 'bg_' + Date.now(),
      userId,
      category,
      limit: Number(limit),
      spent: 0,
    };
    inMemoryBudgets.push(newBudget);
    return res.status(201).json({ success: true, data: newBudget });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
