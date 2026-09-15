const mongoose = require('mongoose');

// In-Memory fallback store for loans
global.inMemoryLoans = global.inMemoryLoans || [
  {
    _id: 'ln_1',
    userId: 'guest',
    loanName: 'Car Loan (HDFC)',
    principalAmount: 600000,
    interestRate: 8.5,
    tenureMonths: 60,
    monthlyEmi: 12314,
    paidMonths: 14,
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
    default: 0,
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

// Helper calculation for EMI
loanSchema.methods.calculateEmi = function() {
  const p = this.principalAmount;
  const r = (this.interestRate / 12) / 100;
  const n = this.tenureMonths;
  if (r === 0) return Math.round(p / n);
  const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.round(emi);
};

const Loan = mongoose.model('Loan', loanSchema);

module.exports = {
  Loan,
  inMemoryLoans: global.inMemoryLoans,
};
