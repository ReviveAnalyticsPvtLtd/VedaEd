const Notification = require('./notificationModel');
const CommunicationLog = require('./communicationLogModel');
const Teacher = require('../teacher/teacherModel');
const Staff = require('../staff/staffModels');
const Student = require('../student/studentModels');
const Parent = require('../parents/parentModel');

// Create a new notification
exports.createNotification = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      audience,
      specificTargets,
      specificTargetModel,
      createdBy,
      createdByModel,
      channels,
      publishDate,
      status
    } = req.body;

    // Validate required fields
    if (!title || !description || !createdBy || !createdByModel) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, createdBy, and createdByModel are required'
      });
    }

    // Check if creator exists
    const mongoose = require("mongoose");
    let creatorExists = false;
    if (createdByModel === 'Teacher') {
      const teacher = await Teacher.findById(createdBy).populate('personalInfo');
      if (teacher) creatorExists = true;
    } else if (createdByModel === 'Admin') {
      const Admin = mongoose.model('Admin');
      const adminObj = await Admin.findById(createdBy);
      if (adminObj) creatorExists = true;
    } else {
      const staff = await Staff.findById(createdBy);
      if (staff) creatorExists = true;
    }

    if (!creatorExists) {
      return res.status(400).json({
        success: false,
        message: 'Creator user not found'
      });
    }

    // Parse publish date
    const parsedPublishDate = publishDate ? new Date(publishDate) : new Date();

    // Determine status
    let finalStatus = status || 'sent';
    if (parsedPublishDate > new Date()) {
      finalStatus = 'scheduled';
    }

    const notificationData = {
      title,
      description,
      type: type || 'Information',
      audience: audience || 'all',
      specificTargets: specificTargets || [],
      specificTargetModel: specificTargetModel || undefined,
      createdBy,
      createdByModel,
      channels: channels || ['app'],
      publishDate: parsedPublishDate,
      status: finalStatus
    };

    const notification = await Notification.create(notificationData);

    // Log action to CommunicationLog
    await CommunicationLog.create({
      user: createdBy,
      userModel: createdByModel,
      action: 'message_sent',
      target: notification._id,
      targetModel: 'Notice',
      details: { title, type, audience }
    });

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// Get all notifications (history)
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status, audience, search } = req.query;

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (audience) query.audience = audience;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const notifications = await Notification.find(query)
      .populate({
        path: 'createdBy',
        select: 'personalInfo.name personalInfo.email'
      })
      .sort({ publishDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// Get single notification
exports.getNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId)
      .populate({
        path: 'createdBy',
        select: 'personalInfo.name personalInfo.email'
      });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// Update notification
exports.updateNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const updateData = req.body;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        notification[key] = updateData[key];
      }
    });

    // If publish date is modified, re-evaluate status
    if (updateData.publishDate) {
      const parsedPublishDate = new Date(updateData.publishDate);
      notification.publishDate = parsedPublishDate;
      if (parsedPublishDate > new Date()) {
        notification.status = 'scheduled';
      } else {
        notification.status = 'sent';
      }
    }

    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification updated successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await Notification.findByIdAndDelete(notificationId);

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// Get notifications statistics
exports.getNotificationStats = async (req, res) => {
  try {
    const totalNotifications = await Notification.countDocuments();
    const sentNotifications = await Notification.countDocuments({ status: 'sent' });
    const scheduledNotifications = await Notification.countDocuments({ status: 'scheduled' });
    const failedNotifications = await Notification.countDocuments({ status: 'failed' });

    // Breakdown by type
    const notificationsByType = await Notification.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalNotifications,
        sentNotifications,
        scheduledNotifications,
        failedNotifications,
        notificationsByType
      }
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// Get received notifications for a specific user
exports.getReceivedNotifications = async (req, res) => {
  try {
    const { userId, userModel } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const modelName = userModel.charAt(0).toUpperCase() + userModel.slice(1).toLowerCase();

    // Query for notifications where:
    // 1. status is 'sent' and publishDate is <= now
    // 2. target matches role or specific targets
    const query = {
      status: 'sent',
      publishDate: { $lte: new Date() },
      $or: [
        { audience: 'all' },
        { audience: modelName.toLowerCase() + 's' },
        { specificTargets: userId }
      ]
    };

    const notifications = await Notification.find(query)
      .populate({
        path: 'createdBy',
        select: 'personalInfo.name personalInfo.email'
      })
      .sort({ publishDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching received notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};
