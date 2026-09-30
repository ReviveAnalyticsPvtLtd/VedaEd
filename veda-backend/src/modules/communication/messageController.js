const Message = require('./messageModel');
const {
  schoolId,
  rejectForeignActor,
  rejectForeignRecipients,
  findPartyModel,
  resolveActor,
  logAction,
  labelFor,
} = require('./communicationTenantScope');

// A message is a private exchange, so the only parties who may see it are its
// own sender and its own receiver. Membership is checked with the session
// identity, never with a client-supplied id.

// `sender`/`receiver` are ObjectIds on a lean query but become populated
// documents once `.populate()` has run, and String(populatedDoc) stringifies
// the whole object rather than the id. Normalise to the id either way.
const refId = (value) => (value && value._id ? String(value._id) : String(value));

function isParticipant(message, actor) {
  const self = String(actor.id);
  return (
    (refId(message.sender) === self && message.senderModel === actor.model) ||
    (refId(message.receiver) === self && message.receiverModel === actor.model)
  );
}

// Create a new message
exports.createMessage = async (req, res) => {
  try {
    const school = schoolId(req);
    const { receiver, subject, content, messageType, priority, attachments, replyTo } = req.body;

    // The sender is the authenticated session. A body `sender` is ignored, so a
    // caller cannot send mail as another user or another school.
    const actor = await resolveActor(req);

    // Validate required fields
    if (!receiver || !subject || !content) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // The receiver must be a real party in the caller's own school.
    if (await rejectForeignRecipients(res, [receiver], school)) return;

    const receiverModel = (await findPartyModel(receiver)).model;
    if (!receiverModel) {
      return res.status(400).json({ success: false, message: 'Receiver not found' });
    }

    const messageData = {
      schoolId: school,
      sender: actor.id,
      senderModel: labelFor(actor.model),
      receiver,
      receiverModel,
      subject,
      content,
      messageType: messageType || 'text',
      priority: priority || 'medium',
      attachments: attachments || [],
      replyTo: replyTo || null
    };

    // If this is a reply, set threadId. The parent message must belong to this
    // school, so a reply cannot be threaded onto another school's message.
    if (replyTo) {
      const parentMessage = await Message.findOne({ _id: replyTo, schoolId: school });
      if (parentMessage) {
        messageData.threadId = parentMessage.threadId || parentMessage._id;
      }
    }

    const message = await Message.create(messageData);

    // Log the action
    await logAction(req, {
      action: 'message_sent',
      target: message._id,
      targetModel: 'Message',
      details: { receiver, receiverModel, subject }
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Get messages for a user (inbox)
exports.getMessages = async (req, res) => {
  try {
    const school = schoolId(req);
    const { userId, userModel } = req.params;
    const { page = 1, limit = 10, status, priority, isImportant } = req.query;

    // An inbox is the caller's own, not an arbitrary party's.
    if (rejectForeignActor(req, res, userId)) return;

    const actor = await resolveActor(req);

    // Scoped three ways: the school, and the receiver identity.
    const query = {
      schoolId: school,
      receiver: actor.id,
      receiverModel: labelFor(actor.model)
    };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (isImportant !== undefined) query.isImportant = isImportant === 'true';

    const messages = await Message.find(query)
      .populate('sender', 'personalInfo.name personalInfo.email name email')
      .populate('receiver', 'personalInfo.name personalInfo.email name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments(query);

    res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Get sent messages for a user
exports.getSentMessages = async (req, res) => {
  try {
    const school = schoolId(req);
    const { userId, userModel } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (rejectForeignActor(req, res, userId)) return;

    const actor = await resolveActor(req);
    const query = { schoolId: school, sender: actor.id, senderModel: labelFor(actor.model) };

    const messages = await Message.find(query)
      .populate('sender', 'personalInfo.name personalInfo.email name email')
      .populate('receiver', 'personalInfo.name personalInfo.email name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments(query);

    res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching sent messages:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Get a specific message
exports.getMessage = async (req, res) => {
  try {
    const school = schoolId(req);
    const { messageId } = req.params;

    // Tenant-scoped: a foreign messageId does not match and 404s.
    const message = await Message.findOne({ _id: messageId, schoolId: school })
      .populate('sender', 'personalInfo.name personalInfo.email name email')
      .populate('receiver', 'personalInfo.name personalInfo.email name email')
      .populate('replyTo')
      .populate('threadId');

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const actor = await resolveActor(req);

    // Being in the right school is not enough: only the two parties may read it.
    if (!isParticipant(message, actor)) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Mark as read if the caller is the receiver. Derived from the session, so
    // a caller cannot mark somebody else's message as read.
    if (
      String(message.receiver) === String(actor.id) &&
      message.receiverModel === actor.model &&
      message.status !== 'read'
    ) {
      message.status = 'read';
      message.readAt = new Date();
      await message.save();

      await logAction(req, {
        action: 'message_read',
        target: message._id,
        targetModel: 'Message'
      });
    }

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Update message status
exports.updateMessageStatus = async (req, res) => {
  try {
    const school = schoolId(req);
    const { messageId } = req.params;
    const { status } = req.body;

    const message = await Message.findOne({ _id: messageId, schoolId: school });
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const actor = await resolveActor(req);
    if (!isParticipant(message, actor)) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    message.status = status;
    if (status === 'read') {
      message.readAt = new Date();
    }

    await message.save();

    await logAction(req, {
      action: 'message_read',
      target: message._id,
      targetModel: 'Message'
    });

    res.status(200).json({
      success: true,
      message: 'Message status updated successfully',
      data: message
    });
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const school = schoolId(req);
    const { messageId } = req.params;

    // Scoped delete, and only the two parties may delete. The old code read the
    // identity out of req.body, so any caller could claim to be either party.
    const message = await Message.findOne({ _id: messageId, schoolId: school });
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const actor = await resolveActor(req);
    if (!isParticipant(message, actor)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this message'
      });
    }

    // Delete through the same tenant scope used for the read, so the write can
    // never reach outside the caller's school.
    await Message.findOneAndDelete({ _id: messageId, schoolId: school });

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};

// Get message thread
exports.getMessageThread = async (req, res) => {
  try {
    const school = schoolId(req);
    const { threadId } = req.params;

    const actor = await resolveActor(req);

    // Thread lookups are tenant-scoped AND participation-scoped, so a threadId
    // cannot be used to read another school's conversation.
    const messages = await Message.find({
      schoolId: school,
      $or: [{ _id: threadId }, { threadId: threadId }]
    })
      .populate('sender', 'personalInfo.name personalInfo.email name email')
      .populate('receiver', 'personalInfo.name personalInfo.email name email')
      .sort({ createdAt: 1 });

    const visible = messages.filter((m) => isParticipant(m, actor));

    res.status(200).json({
      success: true,
      data: visible
    });
  } catch (error) {
    console.error('Error fetching message thread:', error);
    res.status(error.status || 500).json({
      success: false,
      code: error.code,
      message: error.status ? error.message : 'Internal Server Error'
    });
  }
};
