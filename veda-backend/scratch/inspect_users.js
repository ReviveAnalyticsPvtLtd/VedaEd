const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');
const Role = require('../src/models/Role');
const PlatformAdmin = require('../src/models/PlatformAdmin');

async function checkAnjali() {
  const dbUri = process.env.db_Connect_String || process.env.MONGODB_URI || 'mongodb+srv://backend_user:1234567%40Revive@cluster0.4fuvc7q.mongodb.net/veda-sms';
  await mongoose.connect(dbUri);
  console.log('Connected to MongoDB.');

  const users = await User.find({ name: { $regex: /anjali/i } }).populate('roleId');
  console.log('Users matching "anjali":', JSON.stringify(users, null, 2));

  const superadmins = await User.find({}).populate('roleId');
  const filtered = superadmins.filter(u => u.roleId?.name === 'superadmin');
  console.log('All Superadmin users in DB:');
  filtered.forEach(u => {
    console.log({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.roleId?.name,
      activeSession: u.activeSession,
      lastLogin: u.lastLogin
    });
  });

  await mongoose.disconnect();
}

checkAnjali().catch(console.error);
