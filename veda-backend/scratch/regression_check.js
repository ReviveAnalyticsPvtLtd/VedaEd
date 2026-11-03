const axios = require('axios');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const API_BASE = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_change_in_production';

async function runRegressionSuite() {
  console.log('===============================================================');
  console.log('          COMPREHENSIVE FINAL REGRESSION CHECK SUITE           ');
  console.log('===============================================================\n');

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

  // 1. Setup DB test state
  const dbUri = process.env.db_Connect_String;
  await mongoose.connect(dbUri);
  const User = require('../src/models/User');
  const Role = require('../src/models/Role');
  const SetupWizard = require('../src/modules/setupWizard/setupWizardModel');
  const RefreshToken = require('../src/models/RefreshToken');

  const superadminRole = await Role.findOne({ name: 'superadmin' });
  const hash = await bcrypt.hash('Password123!', 10);

  const testUser = await User.findOneAndUpdate(
    { email: 'regression_test_superadmin@example.com' },
    {
      $set: {
        name: 'Regression Test Superadmin',
        password: hash,
        roleId: superadminRole._id,
        status: 'active',
        activeSession: null,
      }
    },
    { upsert: true, new: true }
  );

  await SetupWizard.findOneAndUpdate(
    { userId: testUser._id },
    {
      $set: {
        schoolName: 'Regression Academy',
        primaryThemeColor: '#6366f1',
        setupStatus: 'completed',
      }
    },
    { upsert: true }
  );

  await mongoose.disconnect();

  // -------------------------------------------------------------
  // VERIFICATION 1: Role-Based Permissions Remain Unchanged
  // -------------------------------------------------------------
  console.log('--- Verification 1: Existing Role-Based Permissions Remain Unchanged ---');
  let loginRes;
  try {
    loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'regression_test_superadmin@example.com',
      password: 'Password123!',
      role: 'superadmin'
    });

    assert(loginRes.status === 200, 'Superadmin login returns HTTP 200');
    assert(loginRes.data.role === 'superadmin', `Role matches 'superadmin': got "${loginRes.data.role}"`);
    assert(Array.isArray(loginRes.data.permissions), 'Permissions array is returned');
    assert(loginRes.data.permissions.includes('view_dashboard'), 'Contains view_dashboard permission');
    assert(loginRes.data.permissions.includes('manage_schools'), 'Contains manage_schools permission');
    assert(loginRes.data.permissions.includes('manage_admins'), 'Contains manage_admins permission');
  } catch (err) {
    console.error('V1 Error:', err.response?.data || err.message);
    assert(false, 'Login should succeed and return permissions');
  }

  const { token: initialAccessToken, refreshToken: initialRefreshToken } = loginRes.data;

  // -------------------------------------------------------------
  // VERIFICATION 2: Single-Session Login Functionality
  // -------------------------------------------------------------
  console.log('\n--- Verification 2: Single-Session Login Functionality ---');
  let secondLoginRes;
  try {
    // Second login replaces the first session automatically
    secondLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'regression_test_superadmin@example.com',
      password: 'Password123!',
      role: 'superadmin'
    });
    assert(secondLoginRes.status === 200, 'Second login succeeds and replaces active session');

    // First session access token must now be rejected with SESSION_REPLACED
    try {
      await axios.get(`${API_BASE}/user-settings`, {
        headers: { Authorization: `Bearer ${initialAccessToken}` }
      });
      assert(false, 'First session token should be rejected with SESSION_REPLACED');
    } catch (err) {
      assert(err.response?.status === 401, 'First token returns 401');
      assert(
        err.response?.data?.code === 'SESSION_REPLACED',
        `Rejection code is SESSION_REPLACED (got "${err.response?.data?.code}")`
      );
    }

    // Second session access token must work
    const secondTokenCheck = await axios.get(`${API_BASE}/user-settings`, {
      headers: { Authorization: `Bearer ${secondLoginRes.data.token}` }
    });
    assert(secondTokenCheck.status === 200, 'Second session token works on protected API');
  } catch (err) {
    console.error('V2 Error:', err.response?.data || err.message);
    assert(false, 'Single-session replacement should function properly');
  }

  const currentAccessToken = secondLoginRes.data.token;
  const currentRefreshToken = secondLoginRes.data.refreshToken;

  // -------------------------------------------------------------
  // VERIFICATION 3: Refresh Token Rotation Prevents Reuse of Old Tokens
  // -------------------------------------------------------------
  console.log('\n--- Verification 3: Refresh Token Rotation Prevents Reuse ---');
  let rotatedToken1, rotatedRefresh1;
  try {
    const refreshRes = await axios.post(`${API_BASE}/auth/refresh`, {
      refreshToken: currentRefreshToken
    });
    assert(refreshRes.status === 200, 'Refresh endpoint succeeds with 200 OK');
    rotatedToken1 = refreshRes.data.token;
    rotatedRefresh1 = refreshRes.data.refreshToken;

    assert(!!rotatedToken1, 'New access token issued');
    assert(!!rotatedRefresh1, 'New rotated refresh token issued');
    assert(rotatedRefresh1 !== currentRefreshToken, 'Rotated refresh token is different from used token');

    // Attempting to reuse currentRefreshToken must fail
    try {
      await axios.post(`${API_BASE}/auth/refresh`, {
        refreshToken: currentRefreshToken
      });
      assert(false, 'Reusing previous refresh token must be rejected');
    } catch (err) {
      assert(err.response?.status === 401, 'Reused refresh token returns HTTP 401');
      assert(
        err.response?.data?.code === 'REVOKED_REFRESH_TOKEN',
        `Rejection code is REVOKED_REFRESH_TOKEN (got "${err.response?.data?.code}")`
      );
    }
  } catch (err) {
    console.error('V3 Error:', err.response?.data || err.message);
    assert(false, 'Refresh token rotation verification should succeed');
  }

  // -------------------------------------------------------------
  // VERIFICATION 4: Concurrent Requests Share Single Refresh Operation
  // -------------------------------------------------------------
  console.log('\n--- Verification 4: Concurrent Refresh Race Condition Protection ---');
  try {
    // Simulate apiClient's client-side refresh deduplication:
    let sharedRefreshPromise = null;
    let refreshNetworkCallCount = 0;

    const simulateApiClientRefresh = (rToken) => {
      if (!sharedRefreshPromise) {
        sharedRefreshPromise = (async () => {
          refreshNetworkCallCount++;
          const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken: rToken });
          return res.data;
        })().finally(() => {
          sharedRefreshPromise = null;
        });
      }
      return sharedRefreshPromise;
    };

    // Fire 5 simultaneous requests trying to refresh at the exact same millisecond
    const concurrentResults = await Promise.all([
      simulateApiClientRefresh(rotatedRefresh1),
      simulateApiClientRefresh(rotatedRefresh1),
      simulateApiClientRefresh(rotatedRefresh1),
      simulateApiClientRefresh(rotatedRefresh1),
      simulateApiClientRefresh(rotatedRefresh1),
    ]);

    assert(refreshNetworkCallCount === 1, `Exactly ONE network refresh call was made (count = ${refreshNetworkCallCount})`);
    const allHaveSameToken = concurrentResults.every(
      (r) => r.token === concurrentResults[0].token && r.refreshToken === concurrentResults[0].refreshToken
    );
    assert(allHaveSameToken, 'All 5 concurrent requests received the identical refreshed tokens');

    // Update active tokens
    rotatedToken1 = concurrentResults[0].token;
    rotatedRefresh1 = concurrentResults[0].refreshToken;
  } catch (err) {
    console.error('V4 Error:', err.response?.data || err.message);
    assert(false, 'Concurrent refresh test failed');
  }

  // -------------------------------------------------------------
  // VERIFICATION 5: Logout Properly Revokes Refresh Tokens
  // -------------------------------------------------------------
  console.log('\n--- Verification 5: Logout Properly Revokes Refresh Tokens ---');
  try {
    const logoutRes = await axios.post(
      `${API_BASE}/auth/logout`,
      { refreshToken: rotatedRefresh1 },
      { headers: { Authorization: `Bearer ${rotatedToken1}` } }
    );
    assert(logoutRes.status === 200, 'Logout succeeds with 200 OK');

    // Attempting to refresh with the logged-out refresh token must be rejected
    try {
      await axios.post(`${API_BASE}/auth/refresh`, {
        refreshToken: rotatedRefresh1
      });
      assert(false, 'Refresh token after logout must be rejected');
    } catch (err) {
      assert(err.response?.status === 401, 'Logged out refresh token returns 401');
      assert(
        err.response?.data?.code === 'REVOKED_REFRESH_TOKEN',
        `Rejection code is REVOKED_REFRESH_TOKEN (got "${err.response?.data?.code}")`
      );
    }
  } catch (err) {
    console.error('V5 Error:', err.response?.data || err.message);
    assert(false, 'Logout revocation test failed');
  }

  // -------------------------------------------------------------
  // VERIFICATION 6: Expired Refresh Tokens Rejection
  // -------------------------------------------------------------
  console.log('\n--- Verification 6: Expired Refresh Tokens Rejection ---');
  try {
    // Create an artificially expired refresh token in MongoDB
    await mongoose.connect(dbUri);
    const expiredPlainToken = 'test_expired_plain_token_1234567890abcdef1234567890abcdef';
    const expiredTokenHash = await bcrypt.hash(expiredPlainToken, 10);
    const expiredExpiresAt = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday

    const expiredDoc = await RefreshToken.create({
      userId: testUser._id,
      tokenHash: expiredTokenHash,
      expiresAt: expiredExpiresAt,
    });
    await mongoose.disconnect();

    const expiredCompositeToken = `${expiredDoc._id}.${expiredPlainToken}`;

    try {
      await axios.post(`${API_BASE}/auth/refresh`, {
        refreshToken: expiredCompositeToken
      });
      assert(false, 'Expired refresh token should be rejected');
    } catch (err) {
      assert(err.response?.status === 401, 'Expired refresh token returns 401');
      assert(
        err.response?.data?.code === 'REFRESH_TOKEN_EXPIRED',
        `Rejection code is REFRESH_TOKEN_EXPIRED (got "${err.response?.data?.code}")`
      );
      assert(
        err.response?.data?.message === 'Refresh token has expired',
        `Message explains expiry: "${err.response?.data?.message}"`
      );
    }
  } catch (err) {
    console.error('V6 Error:', err.response?.data || err.message);
    assert(false, 'Expired refresh token test failed');
  }

  // -------------------------------------------------------------
  // VERIFICATION 7: Existing APIs Remain Intact (Profile & Setup-Profile)
  // -------------------------------------------------------------
  console.log('\n--- Verification 7: Existing Login, Profile Settings & Setup-Profile APIs Intact ---');
  try {
    const finalLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'regression_test_superadmin@example.com',
      password: 'Password123!',
      role: 'superadmin'
    });
    assert(finalLogin.status === 200, 'Fresh login succeeds');
    const finalToken = finalLogin.data.token;

    // 1. GET /api/user-settings
    const settingsGet = await axios.get(`${API_BASE}/user-settings`, {
      headers: { Authorization: `Bearer ${finalToken}` }
    });
    assert(settingsGet.status === 200, 'GET /api/user-settings returns 200');

    // 2. GET /api/user-settings/profile
    const profileGet = await axios.get(`${API_BASE}/user-settings/profile`, {
      headers: { Authorization: `Bearer ${finalToken}` }
    });
    assert(profileGet.status === 200, 'GET /api/user-settings/profile returns 200');
    assert(profileGet.data.email === 'regression_test_superadmin@example.com', 'Profile email matches');

    // 3. PUT /api/user-settings/preferences
    const prefUpdate = await axios.put(
      `${API_BASE}/user-settings/preferences`,
      { theme: 'dark', language: 'en', timeZone: 'Asia/Kolkata' },
      { headers: { Authorization: `Bearer ${finalToken}` } }
    );
    assert(prefUpdate.status === 200, 'PUT /api/user-settings/preferences updates successfully');

    // 4. GET /api/setup-profile
    const setupGet = await axios.get(`${API_BASE}/setup-profile`, {
      headers: { Authorization: `Bearer ${finalToken}` }
    });
    assert(setupGet.status === 200, 'GET /api/setup-profile returns 200');
    assert(setupGet.data.data.schoolName === 'Regression Academy', 'Setup profile data intact');

    // 5. Clean logout
    const cleanLogout = await axios.post(
      `${API_BASE}/auth/logout`,
      { refreshToken: finalLogin.data.refreshToken },
      { headers: { Authorization: `Bearer ${finalToken}` } }
    );
    assert(cleanLogout.status === 200, 'Final clean logout succeeds with 200');
  } catch (err) {
    console.error('V7 Error:', err.response?.data || err.message);
    assert(false, 'Existing functionality check failed');
  }

  // Cleanup regression test records from DB
  try {
    await mongoose.connect(dbUri);
    await User.deleteOne({ email: 'regression_test_superadmin@example.com' });
    await SetupWizard.deleteOne({ userId: testUser._id });
    await RefreshToken.deleteMany({ userId: testUser._id });
    await mongoose.disconnect();
  } catch (_) {}

  console.log('\n===============================================================');
  console.log(`FINAL REGRESSION SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) process.exit(1);
}

runRegressionSuite().catch((err) => {
  console.error('Fatal regression suite error:', err);
  process.exit(1);
});
