require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ role: 'superadmin' });
  if (existing) {
    console.log('Super Admin already exists:', existing.email);
    process.exit(0);
  }

  const superAdmin = await User.create({
    name: process.env.SUPER_ADMIN_NAME || 'Super Admin',
    email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@finsync.com',
    password: process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe123!',
    role: 'superadmin',
    status: 'active',
    isEmailVerified: true,
  });

  console.log('Super Admin seeded successfully:', superAdmin.email);
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
