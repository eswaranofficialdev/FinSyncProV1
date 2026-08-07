const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true },
    month: { type: Number, required: true }, // 1-12
    year: { type: Number, required: true },
    limit: { type: Number, required: true, min: 0 },
    spent: { type: Number, default: 0 },
    alertThreshold: { type: Number, default: 80 }, // percentage
  },
  { timestamps: true }
);

budgetSchema.index({ owner: 1, category: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
