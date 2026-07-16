const Notice = require('./noticeModel');
const CommunicationLog = require('./communicationLogModel');
const Teacher = require('../teacher/teacherModel');
const Staff = require('../staff/staffModels');

// Create a new notice
exports.createNotice = async (req, res) => {
  try {
    const {
      title,
      content,
      author,
      authorModel,
      category,
      priority,
      targetAudience,
      specificTargets,
      specificTargetModel,
      attachments,
      publishDate,
      expiryDate,
      isPinned,
      tags
    } = req.body;

    // Validate required fields
    if (!title || !content || !author || !authorModel) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, author, and authorModel are required'
      });
    }

    // Check if author exists
    const mongoose = require("mongoose");
    let authorExists = false;
    if (authorModel === 'Teacher') {
      const teacher = await Teacher.findById(author).populate('personalInfo');
      if (teacher) authorExists = true;
    } else if (authorModel === 'Admin') {
      const Admin = mongoose.model('Admin');
      const adminObj = await Admin.findById(author);
      if (adminObj) authorExists = true;
    } else {
      const staff = await Staff.findById(author);
      if (staff) authorExists = true;
    }

    if (!authorExists) {
      return res.status(400).json({
        success: false,
        message: 'Author not found'
      });
    }

    const noticeData = {
      title,
      content,
      author,
      authorModel,
      category: category || 'general',
      priority: priority || 'medium',
      targetAudience: targetAudience || 'all',
      specificTargets: specificTargets || [],
      specificTargetModel: specificTargetModel || undefined,
      attachments: attachments || [],
      publishDate: publishDate ? new Date(publishDate) : new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      isPinned: isPinned || false,
      tags: tags || [],
      status: 'draft'
    };

    const notice = await Notice.create(noticeData);

    // Log the action
    await CommunicationLog.create({
      user: author,
      userModel: authorModel,
      action: 'notice_created',
      target: notice._id,
      targetModel: 'Notice',
      details: { title, targetAudience }
    });

    res.status(201).json({
      success: true,
      message: 'Notice created successfully',
      data: notice
    });
  } catch (error) {
    console.error('Error creating notice:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// Get all notices
exports.getNotices = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, priority, status, targetAudience, isPinned } = req.query;

    const query = {};
    
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (status) query.status = status;
    if (targetAudience) query.targetAudience = targetAudience;
    if (isPinned !== undefined) query.isPinned = isPinned === 'true';

    const notices = await Notice.find(query)
      .populate({
        path: 'author',
        select: 'personalInfo.name personalInfo.email'
      })
      .sort({ isPinned: -1, publishDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notice.countDocuments(query);

    res.status(200).json({
      success: true,
      data: notices,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// Get published notices for specific audience
exports.getPublishedNotices = async (req, res) => {
  try {
    const { userId, userModel } = req.params;
    const { page = 1, limit = 10, category } = req.query;

    const query = { status: 'published', publishDate: { $lte: new Date() } };
    
    if (category) query.category = category;

    // Filter by target audience
    const audienceQuery = {
      $or: [
        { targetAudience: 'all' },
        { targetAudience: userModel.toLowerCase() + 's' },
        { specificTargets: userId }
      ]
    };

    const notices = await Notice.find({ ...query, ...audienceQuery })
      .populate({
        path: 'author',
        select: 'personalInfo.name personalInfo.email'
      })
      .sort({ isPinned: -1, publishDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notice.countDocuments({ ...query, ...audienceQuery });

    res.status(200).json({
      success: true,
      data: notices,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching published notices:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// Get a specific notice
exports.getNotice = async (req, res) => {
  try {
    const { noticeId } = req.params;
    const { userId, userModel } = req.query;

    const notice = await Notice.findById(noticeId)
      .populate({
        path: 'author',
        select: 'personalInfo.name personalInfo.email'
      });

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    // Log view if user is provided
    if (userId && userModel) {
      const hasViewed = notice.views.some(view => 
        view.user.toString() === userId && view.userModel === userModel
      );

      if (!hasViewed) {
        notice.views.push({
          user: userId,
          userModel: userModel,
          viewedAt: new Date()
        });
        await notice.save();

        // Log the action
        await CommunicationLog.create({
          user: userId,
          userModel: userModel,
          action: 'notice_viewed',
          target: notice._id,
          targetModel: 'Notice'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: notice
    });
  } catch (error) {
    console.error('Error fetching notice:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// Update notice
exports.updateNotice = async (req, res) => {
  try {
    const { noticeId } = req.params;
    const updateData = req.body;

    const notice = await Notice.findById(noticeId);
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        notice[key] = updateData[key];
      }
    });

    await notice.save();

    res.status(200).json({
      success: true,
      message: 'Notice updated successfully',
      data: notice
    });
  } catch (error) {
    console.error('Error updating notice:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// Publish notice
exports.publishNotice = async (req, res) => {
  try {
    const { noticeId } = req.params;
    const { userId, userModel } = req.body;

    const notice = await Notice.findById(noticeId);
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    notice.status = 'published';
    notice.publishDate = new Date();
    await notice.save();

    // Log the action
    if (userId && userModel) {
      await CommunicationLog.create({
        user: userId,
        userModel: userModel,
        action: 'notice_published',
        target: notice._id,
        targetModel: 'Notice'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notice published successfully',
      data: notice
    });
  } catch (error) {
    console.error('Error publishing notice:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// Delete notice
exports.deleteNotice = async (req, res) => {
  try {
    const { noticeId } = req.params;

    const notice = await Notice.findById(noticeId);
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    await Notice.findByIdAndDelete(noticeId);

    res.status(200).json({
      success: true,
      message: 'Notice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notice:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// Get notice statistics
exports.getNoticeStats = async (req, res) => {
  try {
    const totalNotices = await Notice.countDocuments();
    const publishedNotices = await Notice.countDocuments({ status: 'published' });
    const draftNotices = await Notice.countDocuments({ status: 'draft' });
    const pinnedNotices = await Notice.countDocuments({ isPinned: true });

    // Notices by category
    const noticesByCategory = await Notice.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Notices by priority
    const noticesByPriority = await Notice.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalNotices,
        publishedNotices,
        draftNotices,
        pinnedNotices,
        noticesByCategory,
        noticesByPriority
      }
    });
  } catch (error) {
    console.error('Error fetching notice stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};
