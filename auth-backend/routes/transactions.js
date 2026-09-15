const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { Transaction, inMemoryTransactions } = require('../models/Transaction');

// GET /api/transactions - Retrieve all transactions for logged in user
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (req.app.locals.dbConnected) {
      const transactions = await Transaction.find({ user: userId }).sort({ date: -1 });
      return res.json({ success: true, count: transactions.length, data: transactions });
    }

    // In-memory fallback
    const userTx = inMemoryTransactions.filter(t => t.userId === userId || t.userId === 'guest');
    return res.json({ success: true, count: userTx.length, data: userTx });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/transactions - Add new transaction
router.post('/', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { title, type, category, amount, paymentMethod, notes, date } = req.body;

    if (!title || !type || !amount || !category) {
      return res.status(400).json({ success: false, message: 'Title, type, category, and amount are required' });
    }

    if (req.app.locals.dbConnected) {
      const transaction = await Transaction.create({
        user: userId,
        title,
        type,
        category,
        amount: Number(amount),
        paymentMethod: paymentMethod || 'UPI',
        notes: notes || '',
        date: date || Date.now(),
      });
      return res.status(201).json({ success: true, data: transaction });
    }

    // In-memory fallback
    const newTx = {
      _id: 'tx_' + Date.now(),
      userId,
      title,
      type,
      category,
      amount: Number(amount),
      paymentMethod: paymentMethod || 'UPI',
      notes: notes || '',
      date: date || new Date().toISOString(),
    };
    inMemoryTransactions.unshift(newTx);
    return res.status(201).json({ success: true, data: newTx });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (req.app.locals.dbConnected) {
      const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: userId });
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }
      return res.json({ success: true, message: 'Transaction deleted' });
    }

    // In-memory fallback
    const index = inMemoryTransactions.findIndex(t => t._id === req.params.id);
    if (index !== -1) {
      inMemoryTransactions.splice(index, 1);
      return res.json({ success: true, message: 'Transaction deleted' });
    }
    return res.status(404).json({ success: false, message: 'Transaction not found' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
