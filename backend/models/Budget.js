const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Salary', 'Shopping', 'Bills', 'Travel', 'Health', 'Education', 'Investment', 'Loan', 'Savings', 'Food', 'Rent', 'Entertainment', 'Others']
  },
  amount: {
    type: Number,
    required: true,
    min: [1, 'Budget limit must be at least 1']
  },
  periodType: {
    type: String,
    enum: ['monthly', 'weekly', 'yearly'],
    default: 'monthly',
    required: true
  },
  month: {
    type: String, // Format: 'YYYY-MM' for monthly, 'YYYY' for yearly, or 'YYYY-Wxx' for weekly
    required: true
  }
}, { timestamps: true });

// Ensure unique constraint per user, category, periodType, and timeframe
budgetSchema.index({ user: 1, category: 1, periodType: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);