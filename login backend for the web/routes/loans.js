const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { Loan, inMemoryLoans } = require('../models/Loan');

// GET /api/loans - Get user loans
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (req.app.locals.dbConnected) {
      const loans = await Loan.find({ user: userId });
      return res.json({ success: true, count: loans.length, data: loans });
    }

    const userLoans = inMemoryLoans.filter(l => l.userId === userId || l.userId === 'guest');
    return res.json({ success: true, count: userLoans.length, data: userLoans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/loans - Create new loan with automatic EMI calculation
router.post('/', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { loanName, principalAmount, interestRate, tenureMonths } = req.body;

    if (!loanName || !principalAmount || !interestRate || !tenureMonths) {
      return res.status(400).json({ success: false, message: 'All loan fields are required' });
    }

    const p = Number(principalAmount);
    const r = (Number(interestRate) / 12) / 100;
    const n = Number(tenureMonths);
    const emi = r === 0 ? Math.round(p / n) : Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));

    if (req.app.locals.dbConnected) {
      const loan = await Loan.create({
        user: userId,
        loanName,
        principalAmount: p,
        interestRate: Number(interestRate),
        tenureMonths: n,
        monthlyEmi: emi,
      });
      return res.status(201).json({ success: true, data: loan });
    }

    // In-memory fallback
    const newLoan = {
      _id: 'ln_' + Date.now(),
      userId,
      loanName,
      principalAmount: p,
      interestRate: Number(interestRate),
      tenureMonths: n,
      monthlyEmi: emi,
      paidMonths: 0,
      status: 'active',
    };
    inMemoryLoans.push(newLoan);
    return res.status(201).json({ success: true, data: newLoan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/loans/:id - Delete loan
router.delete('/:id', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (req.app.locals.dbConnected) {
      const loan = await Loan.findOneAndDelete({ _id: req.params.id, user: userId });
      if (!loan) {
        return res.status(404).json({ success: false, message: 'Loan not found' });
      }
      return res.json({ success: true, message: 'Loan deleted' });
    }

    const index = inMemoryLoans.findIndex(l => l._id === req.params.id);
    if (index !== -1) {
      inMemoryLoans.splice(index, 1);
      return res.json({ success: true, message: 'Loan deleted' });
    }
    return res.status(404).json({ success: false, message: 'Loan not found' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
