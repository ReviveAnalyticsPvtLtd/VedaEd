const mongoose = require('mongoose');
const CommunicationLog = require('./communicationLogModel');
const { schoolId, rejectForeignActor, resolveActor, labelFor } = require('./communicationTenantScope');

// Get communication logs
exports.getCommunicationLogs = async (req, res) => {
  try {
    const school = schoolId(req);
    const { page = 1, limit = 10, userId, userModel, action, startDate, endDate } = req.query;

    // Tenant scope is applied first and cannot be overridden by a filter.
    const query = { schoolId: school };

    if (userId && userModel) {
      query.user = userId;
      query.userModel = userModel;
    }
    if (action) query.action = action;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await CommunicationLog.find(query)
      .populate('user', 'personalInfo.name personalInfo.email name email')
      .populate('target')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await CommunicationLog.countDocuments(query);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching communication logs:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Get logs for a specific user
exports.getUserLogs = async (req, res) => {
  try {
    const school = schoolId(req);
    const { userId, userModel } = req.params;
    const { page = 1, limit = 10, action, startDate, endDate } = req.query;

    // A log stream belongs to the caller, not to an arbitrary party.
    if (rejectForeignActor(req, res, userId)) return;

    // The party is matched on the actor the session actually resolved to, not
    // on the client-supplied label. A caller sending `userModel=student` (or
    // any other case) still gets their own history, and cannot reach another
    // party's by naming a different model.
    const actor = await resolveActor(req);

    const query = {
      schoolId: school,
      user: String(actor.id),
      userModel: labelFor(actor.model),
    };

    if (action) query.action = action;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await CommunicationLog.find(query)
      .populate('target')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await CommunicationLog.countDocuments(query);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching user logs:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Get communication statistics
exports.getCommunicationStats = async (req, res) => {
  try {
    const school = schoolId(req);
    const { startDate, endDate } = req.query;

    // Every aggregate below inherits the tenant $match, so no metric can
    // report a global total.
    const schoolObjectId = new mongoose.Types.ObjectId(school);
    const query = { schoolId: schoolObjectId };
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const totalLogs = await CommunicationLog.countDocuments(query);

    const logsByAction = await CommunicationLog.aggregate([
      { $match: query },
      { $group: { _id: '$action', count: { $sum: 1 } } }
    ]);

    const logsByUserModel = await CommunicationLog.aggregate([
      { $match: query },
      { $group: { _id: '$userModel', count: { $sum: 1 } } }
    ]);

    const logsByTargetModel = await CommunicationLog.aggregate([
      { $match: { ...query, targetModel: { $exists: true } } },
      { $group: { _id: '$targetModel', count: { $sum: 1 } } }
    ]);

    // Daily activity for the last 30 days
    const dailyActivity = await CommunicationLog.aggregate([
      {
        $match: {
          ...query,
          timestamp: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const mostActiveUsers = await CommunicationLog.aggregate([
      { $match: query },
      { $group: { _id: { user: '$user', userModel: '$userModel' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalLogs,
        logsByAction,
        logsByUserModel,
        logsByTargetModel,
        dailyActivity,
        mostActiveUsers
      }
    });
  } catch (error) {
    console.error('Error fetching communication stats:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Get activity summary for dashboard
exports.getActivitySummary = async (req, res) => {
  try {
    const school = schoolId(req);
    const { userId, userModel } = req.params;
    const { days = 7 } = req.query;

    // Activity is the caller's own, scoped to their school.
    if (rejectForeignActor(req, res, userId)) return;

    const schoolObjectId = new mongoose.Types.ObjectId(school);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const scope = { schoolId: schoolObjectId, user: userId, userModel: userModel };

    const recentActivity = await CommunicationLog.find({
      ...scope,
      timestamp: { $gte: startDate }
    })
      .populate('target')
      .sort({ timestamp: -1 })
      .limit(10);

    const activityCounts = await CommunicationLog.aggregate([
      { $match: { ...scope, timestamp: { $gte: startDate } } },
      { $group: { _id: '$action', count: { $sum: 1 } } }
    ]);

    const dailyActivity = await CommunicationLog.aggregate([
      { $match: { ...scope, timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        recentActivity,
        activityCounts,
        dailyActivity,
        period: `${days} days`
      }
    });
  } catch (error) {
    console.error('Error fetching activity summary:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Create a log entry (for internal use)
exports.createLog = async (req, res) => {
  try {
    const school = schoolId(req);
    const { action, target, targetModel, details, ipAddress, userAgent, sessionId } = req.body;

    if (!action) {
      return res.status(400).json({ success: false, message: 'action is required' });
    }

    // targetModel is a closed enum. Constrain the client's value here rather
    // than letting an unknown string reach the schema.
    const TARGET_MODELS = ['Message', 'Notice', 'Complaint', 'User', 'Notification', 'Template'];
    const safeTargetModel = TARGET_MODELS.includes(targetModel) ? targetModel : 'User';

    // The actor and the tenant are both derived from the session. A client
    // cannot write a log attributed to another school, or to another user.
    const log = await CommunicationLog.create({
      schoolId: school,
      user: req.user.userId,
      userModel: 'Admin',
      action,
      target,
      targetModel: safeTargetModel,
      details,
      ipAddress,
      userAgent,
      sessionId: sessionId || req.user.sessionId,
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Log created successfully',
      data: log
    });
  } catch (error) {
    console.error('Error creating log:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Delete old logs (cleanup)
exports.deleteOldLogs = async (req, res) => {
  try {
    const school = schoolId(req);
    const { days = 90 } = req.query;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Cleanup is scoped to the caller's own school. It can never delete another
    // school's logs, and never touches the quarantined records of this school
    // (they have no schoolId, so they do not match this filter).
    const result = await CommunicationLog.deleteMany({
      schoolId: school,
      timestamp: { $lt: cutoffDate }
    });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} old logs`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting old logs:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};
