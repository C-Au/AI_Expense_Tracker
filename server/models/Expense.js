const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Food & Dining',
        'Transport',
        'Housing',
        'Utilities',
        'Healthcare',
        'Entertainment',
        'Shopping',
        'Travel',
        'Education',
        'Other',
      ],
      default: 'Other',
    },
    uploadBatch: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);
