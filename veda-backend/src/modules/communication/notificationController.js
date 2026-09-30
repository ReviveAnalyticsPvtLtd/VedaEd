const mongoose = require('mongoose');
const Notification = require('./notificationModel');
const {
  schoolId,
  rejectForeignActor,
  rejectForeignRecipients,
  recipientIds,
  labelFor,
  findPartyModel,
  resolveActor,
  logAction,
} = require('./communicationTenantScope');

// Fields a client may change. `schoolId`, `createdBy` and `createdByModel` are
// deliberately absent: ownership and provenance are server-derived.
const MUTABLE_FIELDS = [
  'title',
  'description',
  'type',
  'audience',
  'specificTargets',
  'specificTargetModel',
  'channels',
  'status',
];

// Create a new notification
exports.createNotification = async (req, res) => {
  try {
    const school = schoolId(req);
    const {
      title,
      description,
      type,
      audience,
      specificTargets,
      specificTargetModel,
      channels,
      publishDate,
      status
    } = req.body;

    // Validate required fields. The creator is no longer a client field.
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    // Recipients must all be in the caller's own school.
    const targets = recipientIds(specificTargets);
    if (await rejectForeignRecipients(res, targets, school)) return;

    // The creator is the authenticated session.
    const actor = await resolveActor(req);

    // Parse publish date
    const parsedPublishDate = publishDate ? new Date(publishDate) : new Date();

    // Determine status
    let finalStatus = status || 'sent';
    if (parsedPublishDate > new Date()) {
      finalStatus = 'scheduled';
    }

    const notificationData = {
      // Authoritative tenant, derived from the session.
      schoolId: school,
      title,
      description,
      type: type || 'Information',
      audience: audience || 'all',
      specificTargets: specificTargets || [],
      specificTargetModel: specificTargetModel || undefined,
      createdBy: actor.id,
      createdByModel: labelFor(actor.model),
      channels: channels || ['app'],
      publishDate: parsedPublishDate,
      status: finalStatus
    };

    const notification = await Notification.create(notificationData);

    await logAction(req, {
      action: 'message_sent',
      target: notification._id,
      targetModel: 'Notification',
      details: { title, type, audience }
    });

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Get all notifications (history)
exports.getNotifications = async (req, res) => {
  try {
    const school = schoolId(req);
    const { page = 1, limit = 10, type, status, audience, search } = req.query;

    // Tenant scope first and not overridable by any filter.
    const query = { schoolId: school };
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
        select: 'personalInfo.name personalInfo.email name email'
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
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Get single notification
exports.getNotification = async (req, res) => {
  try {
    const school = schoolId(req);
    const { notificationId } = req.params;

    // Tenant-scoped direct id access: a foreign id does not match and 404s.
    const notification = await Notification.findOne({ _id: notificationId, schoolId: school })
      .populate({
        path: 'createdBy',
        select: 'personalInfo.name personalInfo.email name email'
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
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Update notification
exports.updateNotification = async (req, res) => {
  try {
    const school = schoolId(req);
    const { notificationId } = req.params;
    const updateData = req.body || {};

    const notification = await Notification.findOne({ _id: notificationId, schoolId: school });
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (await rejectForeignRecipients(res, recipientIds(updateData.specificTargets), school)) return;

    // Allow-list only. This drops schoolId, createdBy, createdByModel and
    // anything else a client might send.
    MUTABLE_FIELDS.forEach((key) => {
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
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const school = schoolId(req);
    const { notificationId } = req.params;

    // Scoped delete: a foreign id matches nothing and is left untouched.
    const notification = await Notification.findOneAndDelete({ _id: notificationId, schoolId: school });
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Get notifications statistics
exports.getNotificationStats = async (req, res) => {
  try {
    const school = schoolId(req);
    const scope = { schoolId: school };

    const totalNotifications = await Notification.countDocuments(scope);
    const sentNotifications = await Notification.countDocuments({ ...scope, status: 'sent' });
    const scheduledNotifications = await Notification.countDocuments({ ...scope, status: 'scheduled' });
    const failedNotifications = await Notification.countDocuments({ ...scope, status: 'failed' });

    // Aggregation carries the tenant $match so it cannot report global totals.
    const notificationsByType = await Notification.aggregate([
      { $match: { schoolId: new mongoose.Types.ObjectId(school) } },
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
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Get received notifications for a specific user
exports.getReceivedNotifications = async (req, res) => {
  try {
    const school = schoolId(req);
    const { userId, userModel } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // The feed belongs to the caller, not to an arbitrary party.
    if (rejectForeignActor(req, res, userId)) return;

    const actor = await resolveActor(req);
    const modelName = String(userModel).charAt(0).toUpperCase() + String(userModel).slice(1).toLowerCase();

    // Scoped three ways: the school, the published state, and the audience.
    // The old query had no schoolId at all, so a notification addressed to an
    // individual in another school would surface on this school's feed.
    const query = {
      schoolId: school,
      status: 'sent',
      publishDate: { $lte: new Date() },
      $or: [
        { audience: 'all' },
        { audience: modelName.toLowerCase() + 's' },
        { specificTargets: actor.id }
      ]
    };

    const notifications = await Notification.find(query)
      .populate({
        path: 'createdBy',
        select: 'personalInfo.name personalInfo.email name email'
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
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};
