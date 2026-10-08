const UserSettings = require('./userSettingsModel');
const User = require('../../models/User');
const Staff = require('../staff/staffModels');
const Parent = require('../parents/parentModel');
const Student = require('../student/studentModels');

const getUserId = (req) => req.user?.userId || req.user?.id || req.user?._id;

// Get user settings
exports.getUserSettings = async (req, res) => {
  try {
    const userId = getUserId(req);
    
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
    const userId = getUserId(req);
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
    const userId = getUserId(req);
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
    const userId = getUserId(req);
    const { fullName, email, mobile, phone, department, employeeId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(userId).populate('roleId');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validation
    if (fullName !== undefined) {
      const cleanName = String(fullName).trim();
      if (!cleanName) {
        return res.status(400).json({ message: 'Full name cannot be empty' });
      }
      user.name = cleanName;
    }

    if (email !== undefined) {
      const cleanEmail = String(email).trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!cleanEmail || !emailRegex.test(cleanEmail)) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
      }

      if (cleanEmail !== user.email.toLowerCase()) {
        const existing = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } });
        if (existing) {
          return res.status(400).json({ message: 'Email address is already in use by another user' });
        }
        user.email = cleanEmail;
      }
    }

    const mobileVal = mobile !== undefined ? mobile : phone;
    if (mobileVal !== undefined) {
      const cleanMobile = String(mobileVal).trim();
      if (cleanMobile && !/^\+?[0-9\s-]{7,15}$/.test(cleanMobile)) {
        return res.status(400).json({ message: 'Please enter a valid phone number' });
      }
      user.mobile = cleanMobile;
      user.phone = cleanMobile;
    }

    if (department !== undefined) {
      user.department = String(department).trim();
    }

    if (employeeId !== undefined) {
      user.employeeId = String(employeeId).trim();
    }

    await user.save();

    // Update Staff, Parent or Student model based on refId
    if (user.refId) {
      const staff = await Staff.findById(user.refId);
      if (staff) {
        if (!staff.personalInfo) staff.personalInfo = {};
        if (fullName !== undefined) staff.personalInfo.name = user.name;
        if (email !== undefined) staff.personalInfo.email = user.email;
        if (mobileVal !== undefined) staff.personalInfo.mobileNumber = user.mobile;
        if (department !== undefined) staff.personalInfo.department = user.department;
        if (employeeId !== undefined) staff.personalInfo.staffId = user.employeeId;
        await staff.save();
      }

      const parent = await Parent.findById(user.refId);
      if (parent) {
        if (fullName !== undefined) parent.name = user.name;
        if (email !== undefined) parent.email = user.email;
        if (mobileVal !== undefined) parent.phone = user.mobile;
        if (department !== undefined) parent.occupation = user.department;
        if (employeeId !== undefined) parent.parentId = user.employeeId;
        await parent.save();
      }

      const student = await Student.findById(user.refId);
      if (student) {
        if (!student.personalInfo) student.personalInfo = {};
        if (fullName !== undefined) student.personalInfo.name = user.name;
        if (email !== undefined) {
          if (!student.personalInfo.contactDetails) student.personalInfo.contactDetails = {};
          student.personalInfo.contactDetails.email = user.email;
        }
        if (mobileVal !== undefined) {
          if (!student.personalInfo.contactDetails) student.personalInfo.contactDetails = {};
          student.personalInfo.contactDetails.mobileNumber = user.mobile;
        }
        await student.save();
      }
    }

    let roleName = user.roleId?.name || 'User';
    if (roleName.toLowerCase() === 'superadmin') roleName = 'Super Administrator';
    else if (roleName.toLowerCase() === 'admin') roleName = 'Administrator';

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        fullName: user.name,
        email: user.email,
        mobile: user.mobile || user.phone || '',
        department: user.department || '',
        employeeId: user.employeeId || '',
        role: roleName,
        profilePicture: user.profilePicture || '',
        image: user.profilePicture || ''
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: error.message || 'Failed to update profile' });
  }
};

// Get user profile information
exports.getProfile = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(userId).populate('roleId');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let roleName = user.roleId?.name || 'User';
    if (roleName.toLowerCase() === 'superadmin') roleName = 'Super Administrator';
    else if (roleName.toLowerCase() === 'admin') roleName = 'Administrator';

    let profileData = {
      fullName: user.name,
      email: user.email,
      role: roleName,
      department: user.department || '',
      mobile: user.mobile || user.phone || '',
      employeeId: user.employeeId || '',
      image: user.profilePicture || '',
      profilePicture: user.profilePicture || '',
      status: user.status || 'active',
      createdAt: user.createdAt,
      lastLogin: user.lastLogin || user.updatedAt || user.createdAt
    };

    // Get additional details from Staff or Parent model
    if (user.refId) {
      const staff = await Staff.findById(user.refId);
      if (staff) {
        profileData = {
          ...profileData,
          department: staff.personalInfo?.department || profileData.department,
          mobile: staff.personalInfo?.mobileNumber || profileData.mobile,
          employeeId: staff.personalInfo?.staffId || profileData.employeeId,
          image: staff.personalInfo?.image || profileData.image,
          profilePicture: staff.personalInfo?.image || profileData.profilePicture
        };
      }

      const parent = await Parent.findById(user.refId);
      if (parent) {
        profileData = {
          ...profileData,
          department: parent.occupation || profileData.department,
          mobile: parent.phone || profileData.mobile,
          employeeId: parent.parentId || profileData.employeeId,
          image: parent.profilePhoto || profileData.image,
          profilePicture: parent.profilePhoto || profileData.profilePicture
        };
      }

      const student = await Student.findById(user.refId);
      if (student) {
        profileData = {
          ...profileData,
          fullName: student.personalInfo?.name || profileData.fullName,
          mobile: student.personalInfo?.contactDetails?.mobileNumber || profileData.mobile,
          image: student.personalInfo?.image || profileData.image,
          profilePicture: student.personalInfo?.image || profileData.profilePicture
        };
      }
    }

    res.json(profileData);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

// Upload user profile picture / avatar
exports.uploadAvatar = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Avatar image file is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const avatarPath = `/uploads/${req.file.filename}`;
    user.profilePicture = avatarPath;
    await user.save();

    if (user.refId) {
      const staff = await Staff.findById(user.refId);
      if (staff) {
        if (!staff.personalInfo) staff.personalInfo = {};
        staff.personalInfo.image = avatarPath;
        await staff.save();
      }

      const parent = await Parent.findById(user.refId);
      if (parent) {
        parent.profilePhoto = avatarPath;
        await parent.save();
      }
    }

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      image: avatarPath,
      profilePicture: avatarPath
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ message: error.message || 'Failed to upload profile picture' });
  }
};

// Update security settings
exports.updateSecuritySettings = async (req, res) => {
  try {
    const userId = getUserId(req);
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
