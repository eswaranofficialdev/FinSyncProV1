const mongoose = require('mongoose');

const communityMemberSchema = new mongoose.Schema(
  {
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
    
    // Historical Gross Spending (Never changes on settlement)
    totalContributed: { type: Number, default: 0 }, 
    totalOwed: { type: Number, default: 0 },        
    
    // Settlement Tracking (Changes when payments are made/approved)
    totalPaid: { type: Number, default: 0 },       
    totalReceived: { type: Number, default: 0 },   
  },
  { timestamps: true }
);

// Ensure a user can only be added to a community once
communityMemberSchema.index({ community: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('CommunityMember', communityMemberSchema);