const mongoose = require('mongoose');

// In-Memory fallback store for budgets
global.inMemoryBudgets = global.inMemoryBudgets || [
  { _id: 'bg_1', userId: 'guest', category: 'Food & Dining', limit: 12000, spent: 4800 },
  { _id: 'bg_2', userId: 'guest', category: 'Groceries', limit: 8000, spent: 3450 },
  { _id: 'bg_3', userId: 'guest', category: 'Shopping', limit: 10000, spent: 2200 },
  { _id: 'bg_4', userId: 'guest', category: 'Entertainment', limit: 5000, spent: 1500 }
];

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  limit: {
    type: Number,
    required: true,
    min: 0,
  },
  spent: {
    type: Number,
    default: 0,
    min: 0,
  },
  period: {
    type: String,
    default: 'monthly',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = {
  Budget,
  inMemoryBudgets: global.inMemoryBudgets,
};
