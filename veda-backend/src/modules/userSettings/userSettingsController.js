const UserSettings = require('./userSettingsModel');
const User = require('../../models/User');
const Staff = require('../staff/staffModels');
const Parent = require('../parents/parentModel');

// Get user settings
exports.getUserSettings = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    let settings = await UserSettings.findOne({ userId });
    
    // Create default settings if not exist
    if (!settings) {
      settings = await UserSettings.create({ userId });
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ message: 'Failed to fetch user settings' });
  }
};

// Update user preferences
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { theme, language, timezone } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    let settings = await UserSettings.findOne({ userId });
    
    if (!settings) {
      settings = await UserSettings.create({ userId });
    }

    if (theme !== undefined) settings.preferences.theme = theme;
    if (language !== undefined) settings.preferences.language = language;
    if (timezone !== undefined) settings.preferences.timezone = timezone;

    await settings.save();

    res.json({ message: 'Preferences updated successfully', settings });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ message: 'Failed to update preferences' });
  }
};

// Update notification settings
exports.updateNotifications = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { email, push, sms, marketing } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    let settings = await UserSettings.findOne({ userId });
    
    if (!settings) {
      settings = await UserSettings.create({ userId });
    }

    if (email !== undefined) settings.notifications.email = email;
    if (push !== undefined) settings.notifications.push = push;
    if (sms !== undefined) settings.notifications.sms = sms;
    if (marketing !== undefined) settings.notifications.marketing = marketing;

    await settings.save();

    res.json({ message: 'Notification settings updated successfully', settings });
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({ message: 'Failed to update notification settings' });
  }
};

// Update user profile information
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { fullName, email, mobile, department, employeeId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update User model
    if (fullName) user.name = fullName;
    if (email) user.email = email;
    await user.save();

    // Update Staff or Parent model based on refId
    if (user.refId) {
      const staff = await Staff.findById(user.refId);
      if (staff) {
        if (fullName) staff.personalInfo.name = fullName;
        if (email) staff.personalInfo.email = email;
        if (mobile) staff.personalInfo.mobileNumber = mobile;
        if (department) staff.personalInfo.department = department;
        await staff.save();
      }

      const parent = await Parent.findById(user.refId);
      if (parent) {
        if (fullName) parent.name = fullName;
        if (email) parent.email = email;
        if (mobile) parent.phone = mobile;
        await parent.save();
      }
    }

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

// Get user profile information
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(userId).populate('roleId');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let profileData = {
      fullName: user.name,
      email: user.email,
      role: user.roleId?.name || 'User',
      createdAt: user.createdAt,
      lastLogin: user.updatedAt
    };

    // Get additional details from Staff or Parent model
    if (user.refId) {
      const staff = await Staff.findById(user.refId);
      if (staff) {
        profileData = {
          ...profileData,
          department: staff.personalInfo.department,
          mobile: staff.personalInfo.mobileNumber,
          employeeId: staff.personalInfo.staffId,
          image: staff.personalInfo.image
        };
      }

      const parent = await Parent.findById(user.refId);
      if (parent) {
        profileData = {
          ...profileData,
          department: parent.occupation,
          mobile: parent.phone,
          employeeId: parent.parentId,
          image: parent.profilePhoto
        };
      }
    }

    res.json(profileData);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

// Update security settings
exports.updateSecuritySettings = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { twoFactorEnabled, loginAlerts } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    let settings = await UserSettings.findOne({ userId });
    
    if (!settings) {
      settings = await UserSettings.create({ userId });
    }

    if (twoFactorEnabled !== undefined) settings.security.twoFactorEnabled = twoFactorEnabled;
    if (loginAlerts !== undefined) settings.security.loginAlerts = loginAlerts;

    await settings.save();

    res.json({ message: 'Security settings updated successfully', settings });
  } catch (error) {
    console.error('Error updating security settings:', error);
    res.status(500).json({ message: 'Failed to update security settings' });
  }
};
