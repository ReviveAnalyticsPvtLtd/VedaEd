const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');
const Role = require('./src/models/Role');

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== STARTING ROLE & SINGLE-SESSION AUTOMATIC REPLACEMENT TESTS ===\n');

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

  console.log('\n--- Test 3: Scenario 1 — First Login (Browser A) ---');
  let tokenA = null;
  let sessionIdA = null;
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
    sessionIdA = dbUserA.activeSession?.sessionId;
  } catch (err) {
    console.error('Test 3 error:', err.response?.data || err.message);
    assert(false, 'Login should have succeeded');
  }

  console.log('\n--- Test 4: Scenario 2 — Same Account Logs In on Browser B (Automatic Replacement) ---');
  let tokenB = null;
  let sessionIdB = null;
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test_session_user_a@example.com',
      password: 'Password123!',
      role: 'superadmin'
    });
    assert(res.status === 200, 'Second login succeeds immediately without 409 Conflict');
    assert(Boolean(res.data.token), 'Returns new token');
    tokenB = res.data.token;

    const dbUserAAfterB = await User.findById(testUserA._id);
    assert(dbUserAAfterB.activeSession?.token === tokenB, 'Active session token updated to Session B in DB');
    sessionIdB = dbUserAAfterB.activeSession?.sessionId;
    assert(sessionIdB !== sessionIdA, 'Session ID changed to new unique sessionId');
  } catch (err) {
    console.error('Test 4 error:', err.response?.data || err.message);
    assert(false, 'Second login should have succeeded automatically');
  }

  console.log('\n--- Test 5: Old Browser A Token Rejected on Authenticated Route ---');
  try {
    await axios.post(
      `${API_BASE}/auth/change-password`,
      { currentPassword: 'Password123!', newPassword: 'Password123!' },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    assert(false, 'Old token A should be rejected with 401');
  } catch (err) {
    assert(err.response?.status === 401, 'Old token returns 401 Unauthorized');
    assert(
      err.response?.data?.code === 'SESSION_REPLACED',
      `Identifiable error code returned: ${err.response?.data?.code}`
    );
    assert(
      err.response?.data?.message === 'Your session was ended because your account was signed in from another device or browser.',
      `Message: "${err.response?.data?.message}"`
    );
  }

  console.log('\n--- Test 6: New Browser B Token Remains Valid on Authenticated Route ---');
  try {
    const res = await axios.post(
      `${API_BASE}/auth/change-password`,
      { currentPassword: 'Password123!', newPassword: 'BrandNewPassword123!' },
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    assert(res.status === 200, 'New token B successfully accesses protected route');
  } catch (err) {
    console.error('Test 6 error:', err.response?.data || err.message);
    assert(false, 'New session request should have succeeded');
  }

  console.log('\n--- Test 7: Logout Safety — Old Browser A Logout Does NOT Invalidate Browser B ---');
  try {
    const logoutOldRes = await axios.post(
      `${API_BASE}/auth/logout`,
      {},
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    assert(logoutOldRes.status === 200, 'Old session logout request returns 200');

    // Verify DB still holds Session B
    const dbUserAfterOldLogout = await User.findById(testUserA._id);
    assert(
      dbUserAfterOldLogout.activeSession?.sessionId === sessionIdB,
      'Active session in DB remains Session B (NOT cleared by old token)'
    );

    // Verify Session B still works
    const checkBRes = await axios.post(
      `${API_BASE}/auth/change-password`,
      { currentPassword: 'BrandNewPassword123!', newPassword: 'Password123!' },
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    assert(checkBRes.status === 200, 'Session B still valid and active after Session A logout');
  } catch (err) {
    console.error('Test 7 error:', err.response?.data || err.message);
    assert(false, 'Logout safety test failed');
  }

  console.log('\n--- Test 8: Scenario 3 — Different Accounts (User B) Log In Independently ---');
  let tokenUserB = null;
  try {
    const resUserB = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test_session_user_b@example.com',
      password: 'Password123!',
      role: 'superadmin'
    });
    assert(resUserB.status === 200, 'Different account User B logs in successfully');
    tokenUserB = resUserB.data.token;

    const dbUserB = await User.findById(testUserB._id);
    assert(Boolean(dbUserB.activeSession?.token), 'User B activeSession is recorded in DB');

    // Ensure User A is still active
    const dbUserA = await User.findById(testUserA._id);
    assert(dbUserA.activeSession?.token === tokenB, 'User A remains actively logged in with Session B');
  } catch (err) {
    console.error('Test 8 error:', err.response?.data || err.message);
    assert(false, 'User B login should have succeeded');
  }

  console.log('\n--- Test 9: Active Session Logout Clears DB Session ---');
  try {
    const logoutActiveRes = await axios.post(
      `${API_BASE}/auth/logout`,
      {},
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    assert(logoutActiveRes.status === 200, 'Active session logout succeeds with 200');

    const dbUserAfterActiveLogout = await User.findById(testUserA._id);
    assert(
      dbUserAfterActiveLogout.activeSession === null || !dbUserAfterActiveLogout.activeSession?.sessionId,
      'Active session is now cleared from DB'
    );
  } catch (err) {
    console.error('Test 9 error:', err.response?.data || err.message);
    assert(false, 'Active session logout failed');
  }

  console.log('\n--- Test 10: Scenario 4 & 8 — Expired / Stale Session Allows Normal Login ---');
  try {
    // Manually simulate a stale / expired activeSession in DB
    await User.updateOne(
      { _id: testUserA._id },
      {
        $set: {
          activeSession: {
            sessionId: 'stale_session_123',
            token: 'stale.jwt.token',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
            expiresAt: new Date(Date.now() - 1000 * 60 * 60), // expired 1 hour ago
          }
        }
      }
    );

    const staleReloginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test_session_user_a@example.com',
      password: 'Password123!',
      role: 'superadmin'
    });
    assert(staleReloginRes.status === 200, 'Login with stale/expired session succeeds normally');
    assert(Boolean(staleReloginRes.data.token), 'New token issued');

    const dbUserAfterStale = await User.findById(testUserA._id);
    assert(
      dbUserAfterStale.activeSession?.sessionId !== 'stale_session_123',
      'Stale session replaced with new active session'
    );
  } catch (err) {
    console.error('Test 10 error:', err.response?.data || err.message);
    assert(false, 'Stale session re-login failed');
  }

  console.log('\n--- Test 11: Invalid Credentials Rejected ---');
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
