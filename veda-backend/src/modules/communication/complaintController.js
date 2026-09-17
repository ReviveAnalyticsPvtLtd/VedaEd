const Complaint = require('./complaintModel');
const CommunicationLog = require('./communicationLogModel');
const Student = require('../student/studentModels');
const Teacher = require('../teacher/teacherModel');
const Staff = require('../staff/staffModels');
const Parent = require('../parents/parentModel');

// Create a new complaint
exports.createComplaint = async (req, res) => {
  try {
    const {
      complainant,
      complainantModel,
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
      targetUserModel,
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

    // Check if complainant exists (if not anonymous)
    if (!isAnonymous && complainant && complainantModel) {
      const complainantExists = await validateUser(complainant, complainantModel);
      if (!complainantExists) {
        return res.status(400).json({
          success: false,
          message: 'Complainant not found'
        });
      }
    }

    const complaintData = {
      complainant: isAnonymous ? null : complainant,
      complainantModel: isAnonymous ? null : complainantModel,
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
      targetUserModel,
      sendTo,
      panel
    };

    const complaint = await Complaint.create(complaintData);

    // Log the action
    if (!isAnonymous && complainant && complainantModel) {
      await CommunicationLog.create({
        user: complainant,
        userModel: complainantModel,
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
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// Get all complaints
exports.getComplaints = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, priority, assignedTo, targetUser } = req.query;

    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    if (targetUser) query.targetUser = targetUser;

    const complaints = await Complaint.find(query)
      .populate('complainant', 'personalInfo.name personalInfo.email personalInfo.fullName')
      .populate('assignedTo', 'personalInfo.name personalInfo.email personalInfo.fullName')
      .populate('targetUser', 'personalInfo.name personalInfo.email personalInfo.fullName')
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
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// Get complaints for a specific user
exports.getUserComplaints = async (req, res) => {
  try {
    const { userId, userModel } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    let query;

    if (String(userModel).toLowerCase() === "parent") {
      const parent = await Parent.findById(userId).select("children");
      const childStudentIds = parent && parent.children ? parent.children : [];

      const conditions = [{ complainant: userId, complainantModel: userModel }];
      if (childStudentIds.length > 0) {
        conditions.push({
          targetUser: { $in: childStudentIds },
          targetUserModel: "Student"
        });
      }
      if (status) {
        conditions.forEach((c) => { c.status = status; });
      }
      query = { $or: conditions };
    } else {
      query = { complainant: userId, complainantModel: userModel };
      if (status) query.status = status;
    }

    const complaints = await Complaint.find(query)
      .populate('complainant', 'personalInfo.name personalInfo.email personalInfo.fullName')
      .populate('assignedTo', 'personalInfo.name personalInfo.email personalInfo.fullName')
      .populate('targetUser', 'personalInfo.name personalInfo.email personalInfo.fullName')
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
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// Get a specific complaint
exports.getComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { userId, userModel } = req.query;

    const complaint = await Complaint.findById(complaintId)
      .populate('complainant', 'personalInfo.name personalInfo.email')
      .populate('assignedTo', 'personalInfo.name personalInfo.email')
      .populate('responses.responder', 'personalInfo.name personalInfo.email')
      .populate('resolution.resolvedBy', 'personalInfo.name personalInfo.email');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Log view if user is provided
    if (userId && userModel) {
      await CommunicationLog.create({
        user: userId,
        userModel: userModel,
        action: 'complaint_viewed',
        target: complaint._id,
        targetModel: 'Complaint'
      });
    }

    res.status(200).json({
      success: true,
      data: complaint
    });
  } catch (error) {
    console.error('Error fetching complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// Update complaint status
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status, userId, userModel } = req.body;

    const complaint = await Complaint.findById(complaintId);
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
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// Assign complaint to staff
exports.assignComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { assignedTo, assignedToModel, userId, userModel } = req.body;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check if assigned user exists
    const assignedUserExists = await validateUser(assignedTo, assignedToModel);
    if (!assignedUserExists) {
      return res.status(400).json({
        success: false,
        message: 'Assigned user not found'
      });
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
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// Add response to complaint
exports.addResponse = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { responder, responderModel, response, isInternal, userId, userModel } = req.body;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check if responder exists
    const responderExists = await validateUser(responder, responderModel);
    if (!responderExists) {
      return res.status(400).json({
        success: false,
        message: 'Responder not found'
      });
    }

    const responseData = {
      responder,
      responderModel,
      response,
      isInternal: isInternal || false,
      responseDate: new Date()
    };

    complaint.responses.push(responseData);
    complaint.status = 'in_progress';
    await complaint.save();

    // Log the action
    if (userId && userModel) {
      await CommunicationLog.create({
        user: userId,
        userModel: userModel,
        action: 'complaint_responded',
        target: complaint._id,
        targetModel: 'Complaint'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Response added successfully',
      data: complaint
    });
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// Resolve complaint
exports.resolveComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { description, resolvedBy, resolvedByModel, resolutionType, userId, userModel } = req.body;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    complaint.resolution = {
      description,
      resolvedBy,
      resolvedByModel,
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
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// Delete complaint
exports.deleteComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    await Complaint.findByIdAndDelete(complaintId);

    res.status(200).json({
      success: true,
      message: 'Complaint deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// Get complaint statistics
exports.getComplaintStats = async (req, res) => {
  try {
    const totalComplaints = await Complaint.countDocuments();
    const submittedComplaints = await Complaint.countDocuments({ status: 'submitted' });
    const underReviewComplaints = await Complaint.countDocuments({ status: 'under_review' });
    const inProgressComplaints = await Complaint.countDocuments({ status: 'in_progress' });
    const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });

    // Complaints by category
    const complaintsByCategory = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Complaints by priority
    const complaintsByPriority = await Complaint.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Complaints by status
    const complaintsByStatus = await Complaint.aggregate([
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
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// Helper function to validate user existence
async function validateUser(userId, userModel) {
  try {
    let user;
    switch (userModel) {
      case 'Student':
        user = await Student.findById(userId);
        break;
      case 'Teacher':
        // For teachers, we need to check both Teacher and Staff models
        user = await Teacher.findById(userId).populate('personalInfo');
        if (!user) {
          user = await Staff.findById(userId);
        }
        break;
      case 'Parent':
        user = await Parent.findById(userId);
        break;
      case 'Admin':
        user = await Staff.findById(userId);
        break;
      default:
        return false;
    }
    return !!user;
  } catch (error) {
    return false;
  }
}
