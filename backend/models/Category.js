const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    icon: { type: String, default: 'FaTag' },
    color: { type: String, default: '#4F46E5' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = system default
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
