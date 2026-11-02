const axios = require('axios');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const API_BASE = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_change_in_production';

async function runValidation() {
  console.log('====================================================');
  console.log('   JWT EXPIRATION & REFRESH TOKEN VALIDATION SUITE   ');
  console.log('====================================================\n');

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

  // Connect to DB and ensure testUser has password Password123!
  const dbUri = process.env.db_Connect_String;
  await mongoose.connect(dbUri);
  const User = require('../src/models/User');
  const Role = require('../src/models/Role');
  const SetupWizard = require('../src/modules/setupWizard/setupWizardModel');
  const superadminRole = await Role.findOne({ name: 'superadmin' });
  const hash = await bcrypt.hash('Password123!', 10);
  const updatedUser = await User.findOneAndUpdate(
    { email: 'test_session_user_a@example.com' },
    {
      $set: {
        name: 'Test Super Admin A',
        password: hash,
        roleId: superadminRole._id,
        status: 'active',
        activeSession: null,
      }
    },
    { upsert: true, new: true }
  );

  await SetupWizard.findOneAndUpdate(
    { userId: updatedUser._id },
    {
      $set: {
        schoolName: 'Test School',
        primaryThemeColor: '#4f46e5',
        setupStatus: 'completed',
      }
    },
    { upsert: true }
  );
  await mongoose.disconnect();

  // ----------------------------------------------------
  // 1. Unauthorized requests protection
  // ----------------------------------------------------
  console.log('--- Step 1: Protected APIs Reject Missing / Invalid Token ---');
  try {
    await axios.get(`${API_BASE}/user-settings`);
    assert(false, 'Should fail without token on /api/user-settings');
  } catch (err) {
    assert(err.response?.status === 401, 'Returns 401 for missing token on /api/user-settings');
    assert(
      err.response?.data?.message === 'Authorization token missing or invalid',
      `Message: "${err.response?.data?.message}"`
    );
  }

  try {
    await axios.get(`${API_BASE}/setup-profile`);
    assert(false, 'Should fail without token on /api/setup-profile');
  } catch (err) {
    assert(err.response?.status === 401, 'Returns 401 for missing token on /api/setup-profile');
  }

  try {
    await axios.get(`${API_BASE}/user-settings`, {
      headers: { Authorization: 'Bearer this.is.an.invalid.jwt.token' }
    });
    assert(false, 'Should fail with malformed token');
  } catch (err) {
    assert(err.response?.status === 401, 'Returns 401 for invalid/malformed token');
    assert(err.response?.data?.code === 'INVALID_TOKEN', `Code is INVALID_TOKEN: "${err.response?.data?.code}"`);
  }

  // ----------------------------------------------------
  // 2. Expired Token Handling (Graceful 401 with TOKEN_EXPIRED)
  // ----------------------------------------------------
  console.log('\n--- Step 2: Graceful Handling of Expired JWT Token ---');
  const expiredToken = jwt.sign(
    { userId: '6a9944dfaa34c48e3fbcc83e', role: 'superadmin' },
    JWT_SECRET,
    { expiresIn: '-1h' }
  );

  try {
    await axios.get(`${API_BASE}/user-settings`, {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
    assert(false, 'Should reject expired token on /api/user-settings');
  } catch (err) {
    assert(err.response?.status === 401, 'Returns HTTP 401 for expired token on /api/user-settings');
    assert(err.response?.data?.code === 'TOKEN_EXPIRED', `Returns code: TOKEN_EXPIRED (got "${err.response?.data?.code}")`);
    assert(
      err.response?.data?.message === 'Your session has expired. Please log in again.',
      `Consistent message: "${err.response?.data?.message}"`
    );
    assert(!!err.response?.data?.expiredAt, `Includes expiredAt timestamp: ${err.response?.data?.expiredAt}`);
  }

  try {
    await axios.get(`${API_BASE}/setup-profile`, {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
    assert(false, 'Should reject expired token on /api/setup-profile');
  } catch (err) {
    assert(err.response?.status === 401, 'Returns HTTP 401 for expired token on /api/setup-profile');
    assert(err.response?.data?.code === 'TOKEN_EXPIRED', `Returns code: TOKEN_EXPIRED (got "${err.response?.data?.code}")`);
  }

  // ----------------------------------------------------
  // 3. Login and Fresh JWT + Refresh Token Generation
  // ----------------------------------------------------
  console.log('\n--- Step 3: Login & Fresh JWT + Refresh Token Generation ---');
  let freshToken = null;
  let refreshToken = null;

  try {
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test_session_user_a@example.com',
      password: 'Password123!',
      role: 'superadmin'
    });

    assert(loginRes.status === 200, 'Login succeeds with 200 OK');
    freshToken = loginRes.data.token;
    refreshToken = loginRes.data.refreshToken;

    assert(!!freshToken, 'Fresh JWT token generated');
    assert(!!refreshToken, 'Refresh token generated and returned on login');
    assert(!!loginRes.data.refreshTokenExpiresAt, 'Refresh token expiry timestamp returned');

    const decoded = jwt.decode(freshToken);
    assert(decoded.exp > Math.floor(Date.now() / 1000), 'Fresh token has valid future expiration');
  } catch (err) {
    console.error('Login error:', err.response?.data || err.message);
    assert(false, 'Login should succeed');
  }

  // ----------------------------------------------------
  // 4. Authenticated API Requests with Fresh Token
  // ----------------------------------------------------
  console.log('\n--- Step 4: Authenticated API Requests with Fresh Token ---');
  if (freshToken) {
    try {
      const userSettingsRes = await axios.get(`${API_BASE}/user-settings`, {
        headers: { Authorization: `Bearer ${freshToken}` }
      });
      assert(userSettingsRes.status === 200, 'GET /api/user-settings succeeds with fresh token');
    } catch (err) {
      console.error('user-settings error:', err.response?.data || err.message);
      assert(false, 'GET /api/user-settings should succeed');
    }

    try {
      const setupProfileRes = await axios.get(`${API_BASE}/setup-profile`, {
        headers: { Authorization: `Bearer ${freshToken}` }
      });
      assert(setupProfileRes.status === 200, 'GET /api/setup-profile succeeds with fresh token');
    } catch (err) {
      console.error('setup-profile error:', err.response?.data || err.message);
      assert(false, 'GET /api/setup-profile should succeed');
    }
  }

  // ----------------------------------------------------
  // 5. Refresh Token Mechanism & Token Rotation
  // ----------------------------------------------------
  console.log('\n--- Step 5: Refresh Token Mechanism & Token Rotation ---');
  if (refreshToken) {
    let rotatedAccessToken = null;
    let nextRefreshToken = null;

    try {
      const refreshRes = await axios.post(`${API_BASE}/auth/refresh`, {
        refreshToken
      });

      assert(refreshRes.status === 200, 'POST /api/auth/refresh succeeds with 200 OK');
      rotatedAccessToken = refreshRes.data.token;
      nextRefreshToken = refreshRes.data.refreshToken;

      assert(!!rotatedAccessToken, 'New access token issued upon refresh');
      assert(!!nextRefreshToken, 'Rotated new refresh token issued');
      assert(nextRefreshToken !== refreshToken, 'Token rotation: new refresh token is different from old one');
    } catch (err) {
      console.error('Refresh error:', err.response?.data || err.message);
      assert(false, 'Refresh token should succeed');
    }

    // Verify new access token works
    if (rotatedAccessToken) {
      try {
        const userSettingsRes = await axios.get(`${API_BASE}/user-settings`, {
          headers: { Authorization: `Bearer ${rotatedAccessToken}` }
        });
        assert(userSettingsRes.status === 200, 'New rotated access token works on GET /api/user-settings');
      } catch (err) {
        assert(false, 'New rotated access token should work');
      }
    }

    // Verify old refresh token is revoked and cannot be reused
    try {
      await axios.post(`${API_BASE}/auth/refresh`, {
        refreshToken
      });
      assert(false, 'Old revoked refresh token must be rejected');
    } catch (err) {
      assert(err.response?.status === 401, 'Old revoked refresh token returns 401 Unauthorized');
      assert(
        err.response?.data?.code === 'REVOKED_REFRESH_TOKEN',
        `Rejection code is REVOKED_REFRESH_TOKEN (got "${err.response?.data?.code}")`
      );
    }
  }

  console.log('\n====================================================');
  console.log(`VALIDATION RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runValidation().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
