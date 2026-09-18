const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../src/models/User');
const Role = require('../src/models/Role');

async function seedTestSuperAdmins() {
  const dbUri = process.env.db_Connect_String || process.env.MONGODB_URI || 'mongodb+srv://backend_user:1234567%40Revive@cluster0.4fuvc7q.mongodb.net/veda-sms';
  await mongoose.connect(dbUri);

  const superadminRole = await Role.findOne({ name: 'superadmin' });
  const hash = await bcrypt.hash('Password123!', 10);

  // Superadmin 1
  let user1 = await User.findOne({ email: 'anjali.superadmin@test.com' });
  if (!user1) {
    user1 = await User.create({
      name: 'Anjali Super Admin',
      email: 'anjali.superadmin@test.com',
      password: 'Password123!',
      roleId: superadminRole._id,
      status: 'active'
    });
  } else {
    user1.password = 'Password123!';
    user1.activeSession = null;
    await user1.save();
  }

  // Superadmin 2
  let user2 = await User.findOne({ email: 'second.superadmin@test.com' });
  if (!user2) {
    user2 = await User.create({
      name: 'Second Super Admin',
      email: 'second.superadmin@test.com',
      password: 'Password123!',
      roleId: superadminRole._id,
      status: 'active'
    });
  } else {
    user2.password = 'Password123!';
    user2.activeSession = null;
    await user2.save();
  }

  console.log('Seeded test superadmins:', user1.email, user2.email);
  await mongoose.disconnect();
}

seedTestSuperAdmins().catch(console.error);
