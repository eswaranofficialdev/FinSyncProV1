const mongoose = require('mongoose');

const settlementRequestSchema = new mongoose.Schema(
  {
<<<<<<< Updated upstream
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0.01 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    note: { type: String, default: '' },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    respondedAt: { type: Date, default: null },
=======
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: true,
    },

    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },

    note: {
      type: String,
      default: '',
    },

    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    respondedAt: {
      type: Date,
      default: null,
    },
>>>>>>> Stashed changes
  },
  {
    timestamps: true,
  }
);

// Indexes
settlementRequestSchema.index({ community: 1, status: 1 });
settlementRequestSchema.index({ fromUser: 1 });
settlementRequestSchema.index({ toUser: 1 });

module.exports = mongoose.model(
  'SettlementRequest',
  settlementRequestSchema
);