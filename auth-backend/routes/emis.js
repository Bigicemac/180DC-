const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { Emi, inMemoryEmis } = require('../models/Emi');

// GET /api/emis
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (req.app.locals.dbConnected) {
      const emis = await Emi.find({ user: userId });
      return res.json({ success: true, count: emis.length, data: emis });
    }

    const userEmis = inMemoryEmis.filter(e => e.userId === userId || e.userId === 'guest');
    return res.json({ success: true, count: userEmis.length, data: userEmis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/emis
router.post('/', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { name, amount, dueDay, installments } = req.body;

    if (!name || amount === undefined) {
      return res.status(400).json({ success: false, message: 'Name and amount are required' });
    }

    if (req.app.locals.dbConnected) {
      const emi = await Emi.create({
        user: userId,
        name,
        amount: Number(amount),
        dueDay: dueDay || 'Monthly payment',
        installments: installments || 'Active installment',
      });
      return res.status(201).json({ success: true, data: emi });
    }

    // In-memory fallback
    const newEmi = {
      _id: 'emi_' + Date.now(),
      userId,
      name,
      amount: Number(amount),
      dueDay: dueDay || 'Monthly payment',
      installments: installments || 'Active installment',
    };
    inMemoryEmis.push(newEmi);
    return res.status(201).json({ success: true, data: newEmi });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/emis/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (req.app.locals.dbConnected) {
      const emi = await Emi.findOneAndDelete({ _id: req.params.id, user: userId });
      if (!emi) return res.status(404).json({ success: false, message: 'EMI not found' });
      return res.json({ success: true, message: 'EMI deleted' });
    }

    const index = inMemoryEmis.findIndex(e => e._id === req.params.id);
    if (index !== -1) {
      inMemoryEmis.splice(index, 1);
      return res.json({ success: true, message: 'EMI deleted' });
    }
    return res.status(404).json({ success: false, message: 'EMI not found' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
