const mongoose = require('mongoose');

global.inMemoryFmex = global.inMemoryFmex || [
  { _id: 'fmex_1', userId: 'guest', name: 'House Rent', amount: 18000, dueDay: 'Due 1st of each month', subtitle: 'Direct Bank Transfer • Apartment 402' },
  { _id: 'fmex_2', userId: 'guest', name: 'OTT Subscriptions (Netflix, Prime)', amount: 650, dueDay: 'Due 15th of each month', subtitle: 'Credit Card Auto-debit' },
  { _id: 'fmex_3', userId: 'guest', name: 'Spotify Premium', amount: 300, dueDay: 'Due 20th of each month', subtitle: 'UPI AutoPay' }
];

const fmexSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  dueDay: {
    type: String,
    default: '5th of each month',
  },
  subtitle: {
    type: String,
    default: 'Recurring subscription',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Fmex = mongoose.model('Fmex', fmexSchema);

module.exports = {
  Fmex,
  inMemoryFmex: global.inMemoryFmex,
};
