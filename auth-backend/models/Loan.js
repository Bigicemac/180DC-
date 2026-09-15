const mongoose = require('mongoose');

// In-Memory fallback store for loans
global.inMemoryLoans = global.inMemoryLoans || [
  {
    _id: 'ln_default_1',
    userId: 'guest',
    loanName: 'Personal Gadget Loan',
    principalAmount: 45000,
    interestRate: 11.5,
    tenureMonths: 12,
    monthlyEmi: 3987,
    paidMonths: 4,
    status: 'active'
  }
];

const loanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  loanName: {
    type: String,
    required: true,
    trim: true,
  },
  principalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  interestRate: {
    type: Number,
    required: true,
    min: 0,
  },
  tenureMonths: {
    type: Number,
    required: true,
    min: 1,
  },
  monthlyEmi: {
    type: Number,
    required: true,
    min: 0,
  },
  paidMonths: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Loan = mongoose.model('Loan', loanSchema);

module.exports = {
  Loan,
  inMemoryLoans: global.inMemoryLoans,
};
