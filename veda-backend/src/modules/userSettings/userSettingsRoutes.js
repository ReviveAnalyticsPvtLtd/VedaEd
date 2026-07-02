const express = require('express');
const router = express.Router();
const userSettingsController = require('./userSettingsController');
const authMiddleware = require('../../middleware/authMiddleware');

// Get all user settings
router.get('/', authMiddleware, userSettingsController.getUserSettings);

// Get user profile
router.get('/profile', authMiddleware, userSettingsController.getProfile);

// Update user profile
router.put('/profile', authMiddleware, userSettingsController.updateProfile);

// Update preferences
router.put('/preferences', authMiddleware, userSettingsController.updatePreferences);

// Update notification settings
router.put('/notifications', authMiddleware, userSettingsController.updateNotifications);

// Update security settings
router.put('/security', authMiddleware, userSettingsController.updateSecuritySettings);

module.exports = router;
