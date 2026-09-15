const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { Fmex, inMemoryFmex } = require('../models/Fmex');

// GET /api/fmex
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (req.app.locals.dbConnected) {
      const list = await Fmex.find({ user: userId });
      return res.json({ success: true, count: list.length, data: list });
    }

    const userList = inMemoryFmex.filter(f => f.userId === userId || f.userId === 'guest');
    return res.json({ success: true, count: userList.length, data: userList });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/fmex
router.post('/', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { name, amount, dueDay, subtitle } = req.body;

    if (!name || amount === undefined) {
      return res.status(400).json({ success: false, message: 'Name and amount are required' });
    }

    if (req.app.locals.dbConnected) {
      const item = await Fmex.create({
        user: userId,
        name,
        amount: Number(amount),
        dueDay: dueDay || '5th of each month',
        subtitle: subtitle || 'Recurring monthly expense',
      });
      return res.status(201).json({ success: true, data: item });
    }

    // In-memory fallback
    const newItem = {
      _id: 'fmex_' + Date.now(),
      userId,
      name,
      amount: Number(amount),
      dueDay: dueDay || '5th of each month',
      subtitle: subtitle || 'Recurring monthly expense',
    };
    inMemoryFmex.push(newItem);
    return res.status(201).json({ success: true, data: newItem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/fmex/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (req.app.locals.dbConnected) {
      const item = await Fmex.findOneAndDelete({ _id: req.params.id, user: userId });
      if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
      return res.json({ success: true, message: 'Expense deleted' });
    }

    const index = inMemoryFmex.findIndex(f => f._id === req.params.id);
    if (index !== -1) {
      inMemoryFmex.splice(index, 1);
      return res.json({ success: true, message: 'Expense deleted' });
    }
    return res.status(404).json({ success: false, message: 'Expense not found' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
