const express = require('express');
const router = express.Router();
const messageController = require('./messageController');
const noticeController = require('./noticeController');
const noticeTemplateController = require('./noticeTemplateController');
const messageTemplateController = require('./messageTemplateController');
const complaintController = require('./complaintController');
const communicationLogController = require('./communicationLogController');
const notificationController = require('./notificationController');
const { upload } = require('../../middleware/upload');
const authMiddleware = require('../../middleware/authMiddleware');
const {
  communicationTenantContext,
  requireCommunicationRole,
} = require('./communicationTenantGuard');

// Every communication route is tenant-owned data (notices, messages,
// notifications, complaints, logs). Require an authenticated session.
router.use(authMiddleware);

// Every record in this module belongs to exactly one school. Resolve that
// school from the authenticated account and discard anything the client claims
// about its own school, in the body, the query string and the path.
router.use(communicationTenantContext);

// Message Routes
router.post('/messages', messageController.createMessage);
// Literal-prefixed routes must be registered BEFORE the generic
// '/messages/:userId/:userModel'. They are the same segment count, so the
// generic pattern used to shadow '/messages/single/:messageId' and
// '/messages/thread/:threadId', leaving both handlers unreachable.
router.get('/messages/sent/:userId/:userModel', messageController.getSentMessages);
router.get('/messages/single/:messageId', messageController.getMessage);
router.get('/messages/thread/:threadId', messageController.getMessageThread);
router.get('/messages/:userId/:userModel', messageController.getMessages);
router.put('/messages/:messageId/status', messageController.updateMessageStatus);
router.delete('/messages/:messageId', messageController.deleteMessage);

// Notice Routes
router.post('/notices', requireCommunicationRole('notice'), noticeController.createNotice);
router.get('/notices', noticeController.getNotices);
router.get('/notices/published/:userId/:userModel', noticeController.getPublishedNotices);
router.get('/notices/stats/summary', requireCommunicationRole('notice'), noticeController.getNoticeStats);
router.get('/notices/:noticeId', noticeController.getNotice);
router.put('/notices/:noticeId', requireCommunicationRole('notice'), noticeController.updateNotice);
router.put('/notices/:noticeId/publish', requireCommunicationRole('notice'), noticeController.publishNotice);
router.delete('/notices/:noticeId', requireCommunicationRole('notice'), noticeController.deleteNotice);

// Notification Routes
router.post('/notifications', requireCommunicationRole('notification'), notificationController.createNotification);
router.get('/notifications', requireCommunicationRole('notification'), notificationController.getNotifications);
router.get('/notifications/stats/summary', requireCommunicationRole('notification'), notificationController.getNotificationStats);
router.get('/notifications/received/:userId/:userModel', notificationController.getReceivedNotifications);
router.get('/notifications/:notificationId', notificationController.getNotification);
router.put('/notifications/:notificationId', requireCommunicationRole('notification'), notificationController.updateNotification);
router.delete('/notifications/:notificationId', requireCommunicationRole('notification'), notificationController.deleteNotification);

// Notice Template Routes
router.post('/notice-templates', requireCommunicationRole('template'), noticeTemplateController.createNoticeTemplate);
router.get('/notice-templates', requireCommunicationRole('template'), noticeTemplateController.getNoticeTemplates);
router.put('/notice-templates/:templateId', requireCommunicationRole('template'), noticeTemplateController.updateNoticeTemplate);
router.delete('/notice-templates/:templateId', requireCommunicationRole('template'), noticeTemplateController.deleteNoticeTemplate);

// Message Template Routes
router.post('/message-templates', requireCommunicationRole('template'), messageTemplateController.createMessageTemplate);
router.get('/message-templates', requireCommunicationRole('template'), messageTemplateController.getMessageTemplates);
router.put('/message-templates/:templateId', requireCommunicationRole('template'), messageTemplateController.updateMessageTemplate);
router.delete('/message-templates/:templateId', requireCommunicationRole('template'), messageTemplateController.deleteMessageTemplate);

// Complaint Routes
router.post('/complaints', complaintController.createComplaint);
router.get('/complaints', complaintController.getComplaints);
router.get('/complaints/user/:userId/:userModel', complaintController.getUserComplaints);
router.get('/complaints/stats/summary', requireCommunicationRole('complaint'), complaintController.getComplaintStats);
router.get('/complaints/:complaintId', complaintController.getComplaint);
router.put('/complaints/:complaintId/status', requireCommunicationRole('complaint'), complaintController.updateComplaintStatus);
router.put('/complaints/:complaintId/assign', requireCommunicationRole('complaint'), complaintController.assignComplaint);
router.put('/complaints/:complaintId/response', requireCommunicationRole('complaint'), complaintController.addResponse);
router.put('/complaints/:complaintId/resolve', requireCommunicationRole('complaint'), complaintController.resolveComplaint);
router.delete('/complaints/:complaintId', requireCommunicationRole('complaint'), complaintController.deleteComplaint);

// Communication Log Routes
router.get('/logs', requireCommunicationRole('log'), communicationLogController.getCommunicationLogs);
router.get('/logs/user/:userId/:userModel', communicationLogController.getUserLogs);
router.get('/logs/stats/summary', requireCommunicationRole('log'), communicationLogController.getCommunicationStats);
router.get('/logs/activity/:userId/:userModel', communicationLogController.getActivitySummary);
router.post('/logs', requireCommunicationRole('log'), communicationLogController.createLog);
router.delete('/logs/cleanup', requireCommunicationRole('log'), communicationLogController.deleteOldLogs);

// File upload routes for attachments
router.post('/upload/attachment', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: `/uploads/${req.file.filename}`,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'File upload failed'
    });
  }
});

module.exports = router;
