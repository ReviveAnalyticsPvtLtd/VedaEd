const mongoose = require('mongoose');
const Complaint = require('./complaintModel');
const Parent = require('../parents/parentModel');
const {
  schoolId,
  rejectForeignActor,
  rejectForeignRecipients,
  findPartyModel,
  resolveActor,
  logAction,
  labelFor,
} = require('./communicationTenantScope');

const COMPLAINANT_SELECT = 'personalInfo.name personalInfo.email personalInfo.fullName name email';

/** Complaint statuses the write routes accept. */
const STATUSES = ['submitted', 'under_review', 'in_progress', 'resolved', 'closed', 'rejected'];

// Create a new complaint
exports.createComplaint = async (req, res) => {
  try {
    const school = schoolId(req);
    const {
      subject,
      description,
      category,
      priority,
      attachments,
      isAnonymous,
      tags,
      dueDate,
      complaintAgainst,
      targetUser,
      sendTo,
      panel,
      status
    } = req.body;

    // Validate required fields
    if (!subject || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Subject, description, and category are required'
      });
    }

    // A complaint is about somebody, so that somebody must be in this school.
    if (await rejectForeignRecipients(res, [targetUser].filter(Boolean), school)) return;
    if (await rejectForeignRecipients(res, [sendTo].filter(Boolean), school)) return;

    // The complainant is the authenticated session, not a body field. The old
    // code accepted any complainant id, so a caller could file a complaint in
    // another school's name.
    const actor = await resolveActor(req);

    const complaintData = {
      // Authoritative tenant, derived from the session.
      schoolId: school,
      complainant: isAnonymous ? null : actor.id,
      complainantModel: isAnonymous ? null : actor.model,
      subject,
      description,
      category,
      priority: priority || 'medium',
      attachments: attachments || [],
      isAnonymous: isAnonymous || false,
      tags: tags || [],
      dueDate: dueDate ? new Date(dueDate) : null,
      status: status || 'Pending',
      complaintAgainst,
      targetUser,
      targetUserModel: targetUser ? labelFor((await findPartyModel(targetUser)).model) : undefined,
      sendTo,
      panel
    };

    const complaint = await Complaint.create(complaintData);

    // Log the action
    if (!isAnonymous) {
      await logAction(req, {
        action: 'complaint_submitted',
        target: complaint._id,
        targetModel: 'Complaint',
        details: { subject, category }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      data: complaint
    });
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Get all complaints
exports.getComplaints = async (req, res) => {
  try {
    const school = schoolId(req);
    const { page = 1, limit = 10, status, category, priority, assignedTo, targetUser } = req.query;

    // Tenant scope first, so no filter can widen it.
    const query = { schoolId: school };

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    if (targetUser) query.targetUser = targetUser;

    const complaints = await Complaint.find(query)
      .populate('complainant', COMPLAINANT_SELECT)
      .populate('assignedTo', COMPLAINANT_SELECT)
      .populate('targetUser', COMPLAINANT_SELECT)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Complaint.countDocuments(query);

    res.status(200).json({
      success: true,
      data: complaints,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Get complaints for a specific user
exports.getUserComplaints = async (req, res) => {
  try {
    const school = schoolId(req);
    const { userId, userModel } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    // A complaint history is the caller's own.
    if (rejectForeignActor(req, res, userId)) return;

    const actor = await resolveActor(req);
    const conditions = [{ complainant: actor.id, complainantModel: labelFor(actor.model) }];

    if (String(userModel).toLowerCase() === 'parent') {
      // A parent also sees complaints raised about their own children. The
      // parent record itself must belong to the caller's school.
      const parent = await Parent.findOne({ _id: actor.id, schoolId: school }).select('children').lean();
      const childStudentIds = parent && parent.children ? parent.children : [];

      if (childStudentIds.length > 0) {
        conditions.push({
          targetUser: { $in: childStudentIds },
          targetUserModel: 'Student'
        });
      }
    }

    if (status) conditions.forEach((c) => { c.status = status; });

    // Tenant scope is ANDed with the ownership conditions, never ORed away.
    const query = { schoolId: school, $or: conditions };

    const complaints = await Complaint.find(query)
      .populate('complainant', COMPLAINANT_SELECT)
      .populate('assignedTo', COMPLAINANT_SELECT)
      .populate('targetUser', COMPLAINANT_SELECT)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Complaint.countDocuments(query);

    res.status(200).json({
      success: true,
      data: complaints,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching user complaints:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Get a specific complaint
exports.getComplaint = async (req, res) => {
  try {
    const school = schoolId(req);
    const { complaintId } = req.params;

    // Tenant-scoped direct id access: a foreign complaint simply does not match.
    const complaint = await Complaint.findOne({ _id: complaintId, schoolId: school })
      .populate('complainant', COMPLAINANT_SELECT)
      .populate('assignedTo', COMPLAINANT_SELECT)
      .populate('responses.responder', COMPLAINANT_SELECT)
      .populate('resolution.resolvedBy', COMPLAINANT_SELECT);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // The viewer is the session, not a query parameter.
    await logAction(req, {
      action: 'complaint_viewed',
      target: complaint._id,
      targetModel: 'Complaint'
    });

    res.status(200).json({
      success: true,
      data: complaint
    });
  } catch (error) {
    console.error('Error fetching complaint:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Update complaint status
exports.updateComplaintStatus = async (req, res) => {
  try {
    const school = schoolId(req);
    const { complaintId } = req.params;
    const { status } = req.body;

    if (!STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${STATUSES.join(', ')}`
      });
    }

    const complaint = await Complaint.findOne({ _id: complaintId, schoolId: school });
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    complaint.status = status;
    await complaint.save();

    res.status(200).json({
      success: true,
      message: 'Complaint status updated successfully',
      data: complaint
    });
  } catch (error) {
    console.error('Error updating complaint status:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Assign complaint to staff
exports.assignComplaint = async (req, res) => {
  try {
    const school = schoolId(req);
    const { complaintId } = req.params;
    const { assignedTo } = req.body;

    const complaint = await Complaint.findOne({ _id: complaintId, schoolId: school });
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // The assignee must be a real party in this school.
    if (await rejectForeignRecipients(res, [assignedTo].filter(Boolean), school)) return;

    const assignedToModel = labelFor((await findPartyModel(assignedTo)).model);
    if (!assignedToModel) {
      return res.status(400).json({ success: false, message: 'Assigned user not found' });
    }

    complaint.assignedTo = assignedTo;
    complaint.assignedToModel = assignedToModel;
    complaint.status = 'under_review';
    await complaint.save();

    res.status(200).json({
      success: true,
      message: 'Complaint assigned successfully',
      data: complaint
    });
  } catch (error) {
    console.error('Error assigning complaint:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Add response to complaint
exports.addResponse = async (req, res) => {
  try {
    const school = schoolId(req);
    const { complaintId } = req.params;
    const { response, isInternal } = req.body;

    if (!response) {
      return res.status(400).json({ success: false, message: 'response is required' });
    }

    const complaint = await Complaint.findOne({ _id: complaintId, schoolId: school });
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // The responder is the authenticated session, never a body field.
    const actor = await resolveActor(req);

    complaint.responses.push({
      responder: actor.id,
      responderModel: labelFor(actor.model),
      response,
      isInternal: isInternal || false,
      responseDate: new Date()
    });
    complaint.status = 'in_progress';
    await complaint.save();

    await logAction(req, {
      action: 'complaint_responded',
      target: complaint._id,
      targetModel: 'Complaint'
    });

    res.status(200).json({
      success: true,
      message: 'Response added successfully',
      data: complaint
    });
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Resolve complaint
exports.resolveComplaint = async (req, res) => {
  try {
    const school = schoolId(req);
    const { complaintId } = req.params;
    const { description, resolutionType } = req.body;

    const complaint = await Complaint.findOne({ _id: complaintId, schoolId: school });
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // The resolver is the authenticated session, never a body field.
    const actor = await resolveActor(req);

    complaint.resolution = {
      description,
      resolvedBy: actor.id,
      resolvedByModel: labelFor(actor.model),
      resolvedAt: new Date(),
      resolutionType: resolutionType || 'resolved'
    };
    complaint.status = 'resolved';
    await complaint.save();

    res.status(200).json({
      success: true,
      message: 'Complaint resolved successfully',
      data: complaint
    });
  } catch (error) {
    console.error('Error resolving complaint:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Delete complaint
exports.deleteComplaint = async (req, res) => {
  try {
    const school = schoolId(req);
    const { complaintId } = req.params;

    // Scoped delete: a foreign complaintId matches nothing and is untouched.
    const complaint = await Complaint.findOneAndDelete({ _id: complaintId, schoolId: school });
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Complaint deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Get complaint statistics
exports.getComplaintStats = async (req, res) => {
  try {
    const school = schoolId(req);
    const scope = { schoolId: school };

    const totalComplaints = await Complaint.countDocuments(scope);
    const submittedComplaints = await Complaint.countDocuments({ ...scope, status: 'submitted' });
    const underReviewComplaints = await Complaint.countDocuments({ ...scope, status: 'under_review' });
    const inProgressComplaints = await Complaint.countDocuments({ ...scope, status: 'in_progress' });
    const resolvedComplaints = await Complaint.countDocuments({ ...scope, status: 'resolved' });

    // Aggregations carry the tenant $match so they cannot report global totals.
    const schoolObjectId = new mongoose.Types.ObjectId(school);
    const match = { $match: { schoolId: schoolObjectId } };

    const complaintsByCategory = await Complaint.aggregate([
      match,
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const complaintsByPriority = await Complaint.aggregate([
      match,
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const complaintsByStatus = await Complaint.aggregate([
      match,
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalComplaints,
        submittedComplaints,
        underReviewComplaints,
        inProgressComplaints,
        resolvedComplaints,
        complaintsByCategory,
        complaintsByPriority,
        complaintsByStatus
      }
    });
  } catch (error) {
    console.error('Error fetching complaint stats:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};
