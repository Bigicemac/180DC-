const mongoose = require('mongoose');

global.inMemoryEmis = global.inMemoryEmis || [
  { _id: 'emi_1', userId: 'guest', name: 'Phone EMI', amount: 2100, dueDay: 'Due 18 Sep', installments: '8 of 12 installments paid' },
  { _id: 'emi_2', userId: 'guest', name: 'Laptop EMI', amount: 3400, dueDay: 'Due 22 Sep', installments: '4 of 10 installments paid' }
];

const emiSchema = new mongoose.Schema({
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
    default: '15th of each month',
  },
  installments: {
    type: String,
    default: 'Active installment',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Emi = mongoose.model('Emi', emiSchema);

module.exports = {
  Emi,
  inMemoryEmis: global.inMemoryEmis,
};
