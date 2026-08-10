const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'expense_added', 'user_created', 'settlement_pending', 'approval_pending',
        'password_changed', 'community_invite', 'admin_approved', 'admin_rejected', 'general',
        'settlement_requested', 'settlement_approved', 'settlement_rejected',
      ],
      default: 'general',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);