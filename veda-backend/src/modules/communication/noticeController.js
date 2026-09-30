const mongoose = require('mongoose');
const Notice = require('./noticeModel');
const {
  schoolId,
  rejectForeignActor,
  rejectForeignRecipients,
  recipientIds,
  resolveActor,
  labelFor,
  logAction,
} = require('./communicationTenantScope');

// Fields a client is allowed to change on an existing notice. `schoolId`,
// `author` and `authorModel` are deliberately absent: ownership and provenance
// are server-derived and immutable.
const MUTABLE_FIELDS = [
  'title',
  'content',
  'category',
  'priority',
  'targetAudience',
  'specificTargets',
  'specificTargetModel',
  'attachments',
  'publishDate',
  'expiryDate',
  'isPinned',
  'tags',
  'status',
];

// Create a new notice
exports.createNotice = async (req, res) => {
  try {
    const school = schoolId(req);
    const {
      title,
      content,
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

    // Validate required fields. The author is no longer a client field: it is
    // derived from the authenticated session.
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // A notice may only target people in the caller's own school.
    const targets = recipientIds(specificTargets);
    if (await rejectForeignRecipients(res, targets, school)) return;

    const noticeData = {
      // Authoritative tenant, derived from the session - never from the body.
      schoolId: school,
      title,
      content,
      author: req.user.userId,
      // 'Admin' is the users collection alias; see labelFor in the scope helper.
      authorModel: 'Admin',
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
    await logAction(req, {
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
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Get all notices
exports.getNotices = async (req, res) => {
  try {
    const school = schoolId(req);
    const { page = 1, limit = 10, category, priority, status, targetAudience, isPinned } = req.query;

    // Tenant scope is applied first and cannot be overridden by a filter.
    const query = { schoolId: school };

    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (status) query.status = status;
    if (targetAudience) query.targetAudience = targetAudience;
    if (isPinned !== undefined) query.isPinned = isPinned === 'true';

    const notices = await Notice.find(query)
      .populate({
        path: 'author',
        select: 'name email'
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
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Get published notices for specific audience
exports.getPublishedNotices = async (req, res) => {
  try {
    const school = schoolId(req);
    const { userId, userModel } = req.params;
    const { page = 1, limit = 10, category } = req.query;

    // The audience is the caller's own identity, not an arbitrary party id.
    if (rejectForeignActor(req, res, userId)) return;

    const query = {
      schoolId: school,
      status: 'published',
      publishDate: { $lte: new Date() }
    };

    if (category) query.category = category;

    // The audience is decided by the identity the session resolved to, never by
    // the `userModel` path parameter. Trusting that label let any caller widen
    // its own audience: `?userModel=admin` matched targetAudience 'admins' and
    // the Admin tag, so a student could read notices never addressed to
    // students. The party id is still validated above; the role is taken from
    // the actor.
    const actor = await resolveActor(req);
    const actorModel = labelFor(actor.model);

    // Map the requesting user's model/role to the role tags used when posting
    const roleToTag = (model) => {
      const normalized = String(model || '').toLowerCase().trim();
      if (normalized === 'staff' || normalized === 'receptionist' || normalized === 'librarian' || normalized === 'accountant') {
        return ['Staff', 'Receptionist', 'Librarian', 'Accountant'];
      }
      const tagMap = {
        student: ['Student'],
        teacher: ['Teacher'],
        parent: ['Parent'],
        admin: ['Admin'],
        'super admin': ['Super Admin'],
      };
      return tagMap[normalized] || [];
    };

    // Filter by target audience: 'all' only matches real broadcasts (no role tags),
    // role-restricted notices are matched via their tags for the requesting role.
    const singularTargetAudience = String(actorModel).toLowerCase() === 'staff'
      ? 'staff'
      : String(actorModel).toLowerCase() + 's';
    const audienceQuery = {
      $or: [
        {
          targetAudience: 'all',
          $or: [
            { tags: { $size: 0 } },
            { tags: { $exists: false } },
          ],
        },
        { targetAudience: singularTargetAudience },
        { specificTargets: String(actor.id) },
        { tags: { $in: roleToTag(actorModel) } }
      ]
    };

    const notices = await Notice.find({ ...query, ...audienceQuery })
      .populate({
        path: 'author',
        select: 'name email'
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
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Get a specific notice
exports.getNotice = async (req, res) => {
  try {
    const school = schoolId(req);
    const { noticeId } = req.params;

    // Direct id access is tenant-scoped: a notice belonging to another school
    // simply does not match, so it 404s exactly like a missing notice.
    const notice = await Notice.findOne({ _id: noticeId, schoolId: school })
      .populate({
        path: 'author',
        select: 'name email'
      });

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    // Log the view. The viewer is the authenticated session, not a query field,
    // so a caller cannot forge a view on behalf of another school.
    const hasViewed = notice.views.some(view =>
      String(view.user) === String(req.user.userId)
    );

    if (!hasViewed) {
      notice.views.push({
        user: req.user.userId,
        userModel: 'Admin',
        viewedAt: new Date()
      });
      await notice.save();

      await logAction(req, {
        action: 'notice_viewed',
        target: notice._id,
        targetModel: 'Notice'
      });
    }

    res.status(200).json({
      success: true,
      data: notice
    });
  } catch (error) {
    console.error('Error fetching notice:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Update notice
exports.updateNotice = async (req, res) => {
  try {
    const school = schoolId(req);
    const { noticeId } = req.params;
    const updateData = req.body || {};

    const notice = await Notice.findOne({ _id: noticeId, schoolId: school });
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    if (await rejectForeignRecipients(res, recipientIds(updateData.specificTargets), school)) return;

    // Only the allow-listed fields are copied. This drops schoolId, author,
    // authorModel, views and anything else a client might send.
    MUTABLE_FIELDS.forEach((key) => {
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
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Publish notice
exports.publishNotice = async (req, res) => {
  try {
    const school = schoolId(req);
    const { noticeId } = req.params;

    const notice = await Notice.findOne({ _id: noticeId, schoolId: school });
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    notice.status = 'published';
    notice.publishDate = new Date();
    await notice.save();

    await logAction(req, {
      action: 'notice_published',
      target: notice._id,
      targetModel: 'Notice'
    });

    res.status(200).json({
      success: true,
      message: 'Notice published successfully',
      data: notice
    });
  } catch (error) {
    console.error('Error publishing notice:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Delete notice
exports.deleteNotice = async (req, res) => {
  try {
    const school = schoolId(req);
    const { noticeId } = req.params;

    // Scoped delete: a foreign noticeId matches nothing and is left untouched.
    const notice = await Notice.findOneAndDelete({ _id: noticeId, schoolId: school });
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notice:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Get notice statistics
exports.getNoticeStats = async (req, res) => {
  try {
    const school = schoolId(req);
    const scope = { schoolId: school };

    const totalNotices = await Notice.countDocuments(scope);
    const publishedNotices = await Notice.countDocuments({ ...scope, status: 'published' });
    const draftNotices = await Notice.countDocuments({ ...scope, status: 'draft' });
    const pinnedNotices = await Notice.countDocuments({ ...scope, isPinned: true });

    // Aggregations are scoped too, otherwise they would report global totals.
    const schoolObjectId = new mongoose.Types.ObjectId(school);
    const noticesByCategory = await Notice.aggregate([
      { $match: { schoolId: schoolObjectId } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const noticesByPriority = await Notice.aggregate([
      { $match: { schoolId: schoolObjectId } },
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
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};
