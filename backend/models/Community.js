const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['Family', 'Office', 'Friends', 'Trip', 'Apartment', 'Hostel', 'College', 'Other'],
      default: 'Other',
    },
    description: { type: String, default: '' },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // creator/owner admin
    coverImage: { type: String, default: '' },
    wallet: { type: Number, default: 0 }, // community shared wallet balance
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Community', communitySchema);
