const mongoose = require('mongoose');

const communityMemberSchema = new mongoose.Schema(
  {
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
    totalContributed: { type: Number, default: 0 },
    totalOwed: { type: Number, default: 0 }, // positive = owes money, negative = is owed
  },
  { timestamps: true }
);

communityMemberSchema.index({ community: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('CommunityMember', communityMemberSchema);
