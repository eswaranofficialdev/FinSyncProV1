const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    transactionNumber: { type: String, unique: true }, // auto-generated TXN-000001
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', default: null },

    type: {
      type: String,
      enum: ['income', 'expense', 'investment', 'loan', 'savings'],
      required: true,
    },
    category: {
      type: String,
      enum: [
        'Salary', 'Shopping', 'Bills', 'Travel', 'Health', 'Education',
        'Investment', 'Loan', 'Savings', 'Food', 'Rent', 'Entertainment', 'Others',
        'Community Payment' // 🌟 ADDED: Required for settlement transactions to save without validation errors
      ],
      default: 'Others',
    },

    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now },
    description: { type: String, default: '' },

    paymentMode: {
      type: String,
      enum: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Wallet', 'Other'],
      default: 'Cash',
    },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },

    receipt: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    tags: [{ type: String }],

    isRecurring: { type: Boolean, default: false },
    recurringFrequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly', null], default: null },

    reminder: { type: Date, default: null },
    isPinned: { type: Boolean, default: false },

    // 🌟 ADDED: Fixes the "Cannot populate path splitAmong" error 🌟
    splitAmong: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }]
  },
  { timestamps: true }
);

transactionSchema.index({ owner: 1, date: -1 });
transactionSchema.index({ community: 1 });

transactionSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  const count = await mongoose.model('Transaction').countDocuments();
  this.transactionNumber = `TXN-${String(count + 1).padStart(6, '0')}`;
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);