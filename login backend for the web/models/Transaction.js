const mongoose = require('mongoose');

// In-Memory fallback store for transactions
global.inMemoryTransactions = global.inMemoryTransactions || [
  {
    _id: 'tx_default_1',
    userId: 'guest',
    title: 'Grocery Store & Provisions',
    type: 'expense',
    category: 'Groceries',
    amount: 3450,
    paymentMethod: 'UPI',
    date: new Date().toISOString(),
    notes: 'Weekly pantry restock'
  },
  {
    _id: 'tx_default_2',
    userId: 'guest',
    title: 'Monthly Tech Salary',
    type: 'income',
    category: 'Salary',
    amount: 95000,
    paymentMethod: 'Bank Transfer',
    date: new Date().toISOString(),
    notes: 'Direct deposit'
  }
];

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentMethod: {
    type: String,
    default: 'UPI',
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = {
  Transaction,
  inMemoryTransactions: global.inMemoryTransactions,
};
