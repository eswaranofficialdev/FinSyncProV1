const mongoose = require('mongoose');

// A member's request to pay off some or all of what they owe in a community.
// Nothing changes on the balance sheet until the community Owner approves it.
const settlementRequestSchema = new mongoose.Schema(
  {
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0.01 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    note: { type: String, default: '' },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

settlementRequestSchema.index({ community: 1, status: 1 });
settlementRequestSchema.index({ fromUser: 1 });

module.exports = mongoose.model('SettlementRequest', settlementRequestSchema);