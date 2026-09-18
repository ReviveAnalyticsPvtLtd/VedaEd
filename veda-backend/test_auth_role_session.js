const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');
const Role = require('./src/models/Role');

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== STARTING PORT 5000 ROLE & SESSION SECURITY TESTS ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // Connect to DB to inspect / reset test state
  const dbUri = process.env.db_Connect_String || process.env.MONGODB_URI || 'mongodb+srv://backend_user:1234567%40Revive@cluster0.4fuvc7q.mongodb.net/veda-sms';
  await mongoose.connect(dbUri);
  console.log('Connected to MongoDB.\n');

  const superadminRole = await Role.findOne({ name: 'superadmin' });

  // Find or create test users
  let testUserA = await User.findOne({ email: 'test_session_user_a@example.com' }).populate('roleId');
  if (!testUserA) {
    testUserA = await User.create({
      name: 'Test Super Admin A',
      email: 'test_session_user_a@example.com',
      password: 'Password123!',
      roleId: superadminRole._id,
      status: 'active'
    });
    testUserA = await User.findById(testUserA._id).populate('roleId');
  } else {
    // Reset active session
    await User.updateOne({ _id: testUserA._id }, { $set: { activeSession: null } });
  }

  let testUserB = await User.findOne({ email: 'test_session_user_b@example.com' }).populate('roleId');
  if (!testUserB) {
    testUserB = await User.create({
      name: 'Test Super Admin B',
      email: 'test_session_user_b@example.com',
      password: 'Password123!',
      roleId: superadminRole._id,
      status: 'active'
    });
    testUserB = await User.findById(testUserB._id).populate('roleId');
  } else {
    // Reset active session
    await User.updateOne({ _id: testUserB._id }, { $set: { activeSession: null } });
  }

  console.log('--- Test 1: Role Not Selected ---');
  try {
    await axios.post(`${API_BASE}/auth/login`, {
      email: 'test_session_user_a@example.com',
      password: 'Password123!',
    });
    assert(false, 'Should reject login when role is not provided');
  } catch (err) {
    assert(err.response?.status === 400, 'Returns 400 when role is missing');
    assert(
      err.response?.data?.message === 'Please select your role before logging in.',
      `Message: "${err.response?.data?.message}"`
    );
  }

  console.log('\n--- Test 2: Wrong Role Selected (Super Admin credentials + Teacher selected) ---');
  try {
    await axios.post(`${API_BASE}/auth/login`, {
      email: 'test_session_user_a@example.com',
      password: 'Password123!',
      role: 'teacher'
    });
    assert(false, 'Should reject login when selected role does not match account role');
  } catch (err) {
    assert(err.response?.status === 401, 'Returns 401 on role mismatch');
    assert(
      err.response?.data?.message === 'The selected role does not match this account.',
      `Message: "${err.response?.data?.message}"`
    );
  }

  console.log('\n--- Test 3: Correct Role Login (Super Admin credentials + Super Admin selected) ---');
  let tokenA = null;
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test_session_user_a@example.com',
      password: 'Password123!',
      role: 'superadmin'
    });
    assert(res.status === 200, 'Returns 200 on valid credentials & role');
    assert(Boolean(res.data.token), 'Returns valid token');
    tokenA = res.data.token;

    const dbUserA = await User.findById(testUserA._id);
    assert(Boolean(dbUserA.activeSession?.token), 'User activeSession is recorded in DB');
    assert(Boolean(dbUserA.activeSession?.sessionId), 'User activeSession has sessionId in DB');
  } catch (err) {
    console.error('Test 3 error:', err.response?.data || err.message);
    assert(false, 'Login should have succeeded');
  }

  console.log('\n--- Test 4: Simultaneous Login for Same Account Blocked ---');
  try {
    await axios.post(`${API_BASE}/auth/login`, {
      email: 'test_session_user_a@example.com',
      password: 'Password123!',
      role: 'superadmin'
    });
    assert(false, 'Second simultaneous login attempt should be blocked');
  } catch (err) {
    assert(err.response?.status === 409, 'Returns 409 Conflict for active session');
    assert(
      err.response?.data?.message === 'This account is already logged in on another device or browser. Please log out from the existing session before logging in here.',
      `Message: "${err.response?.data?.message}"`
    );
  }

  console.log('\n--- Test 5: First Session Still Active & Protected Route Works ---');
  try {
    const dbUserA = await User.findById(testUserA._id);
    assert(dbUserA.activeSession?.token === tokenA, 'First session token is unchanged and active');
  } catch (err) {
    assert(false, 'First session check failed');
  }

  console.log('\n--- Test 6: Different Accounts with Same Role Allowed Simultaneously ---');
  let tokenB = null;
  try {
    const resB = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test_session_user_b@example.com',
      password: 'Password123!',
      role: 'superadmin'
    });
    assert(resB.status === 200, 'Different account User B logs in successfully');
    tokenB = resB.data.token;

    const dbUserB = await User.findById(testUserB._id);
    assert(Boolean(dbUserB.activeSession?.token), 'User B activeSession is recorded in DB');

    // Ensure User A is still active
    const dbUserA = await User.findById(testUserA._id);
    assert(Boolean(dbUserA.activeSession?.token), 'User A remains actively logged in');
  } catch (err) {
    console.error('Test 6 error:', err.response?.data || err.message);
    assert(false, 'User B login should have succeeded');
  }

  console.log('\n--- Test 7: Logout User A and Re-login from Device 2 ---');
  try {
    const logoutRes = await axios.post(
      `${API_BASE}/auth/logout`,
      {},
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    assert(logoutRes.status === 200, 'Logout succeeds with 200');

    const dbUserAAfterLogout = await User.findById(testUserA._id);
    assert(dbUserAAfterLogout.activeSession === null || !dbUserAAfterLogout.activeSession?.token, 'User A activeSession is cleared in DB');

    // Now Device 2 logs in with User A credentials
    const reloginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test_session_user_a@example.com',
      password: 'Password123!',
      role: 'superadmin'
    });
    assert(reloginRes.status === 200, 'User A can log in again after logout');
    tokenA = reloginRes.data.token;
  } catch (err) {
    console.error('Test 7 error:', err.response?.data || err.message);
    assert(false, 'Logout and re-login failed');
  }

  console.log('\n--- Test 8: Expired Session Allows Re-login (No Permanent Lockout) ---');
  try {
    // Manually set User A activeSession expiresAt in the past
    await User.updateOne(
      { _id: testUserA._id },
      {
        $set: {
          'activeSession.expiresAt': new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
        }
      }
    );

    const expiredReloginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test_session_user_a@example.com',
      password: 'Password123!',
      role: 'superadmin'
    });
    assert(expiredReloginRes.status === 200, 'Expired session allows new login');
  } catch (err) {
    console.error('Test 8 error:', err.response?.data || err.message);
    assert(false, 'Expired session re-login failed');
  }

  console.log('\n--- Test 9: Invalid Credentials Handling Preserved ---');
  try {
    await axios.post(`${API_BASE}/auth/login`, {
      email: 'test_session_user_a@example.com',
      password: 'WrongPassword!',
      role: 'superadmin'
    });
    assert(false, 'Wrong password should be rejected');
  } catch (err) {
    assert(err.response?.status === 401, 'Returns 401 for invalid credentials');
    assert(err.response?.data?.message === 'Invalid credentials', `Message: "${err.response?.data?.message}"`);
  }

  // Cleanup test users
  await User.deleteOne({ email: 'test_session_user_a@example.com' });
  await User.deleteOne({ email: 'test_session_user_b@example.com' });

  await mongoose.disconnect();

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
