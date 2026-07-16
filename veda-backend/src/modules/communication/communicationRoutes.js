const express = require('express');
const router = express.Router();
const messageController = require('./messageController');
const noticeController = require('./noticeController');
const noticeTemplateController = require('./noticeTemplateController');
const complaintController = require('./complaintController');
const communicationLogController = require('./communicationLogController');
const notificationController = require('./notificationController');
const { upload } = require('../../middleware/upload');


// Message Routes
router.post('/messages', messageController.createMessage);
router.get('/messages/:userId/:userModel', messageController.getMessages);
router.get('/messages/sent/:userId/:userModel', messageController.getSentMessages);
router.get('/messages/thread/:threadId', messageController.getMessageThread);
router.get('/messages/single/:messageId', messageController.getMessage);
router.put('/messages/:messageId/status', messageController.updateMessageStatus);
router.delete('/messages/:messageId', messageController.deleteMessage);

// Notice Routes
router.post('/notices', noticeController.createNotice);
router.get('/notices', noticeController.getNotices);
router.get('/notices/published/:userId/:userModel', noticeController.getPublishedNotices);
router.get('/notices/:noticeId', noticeController.getNotice);
router.put('/notices/:noticeId', noticeController.updateNotice);
router.put('/notices/:noticeId/publish', noticeController.publishNotice);
router.delete('/notices/:noticeId', noticeController.deleteNotice);
router.get('/notices/stats/summary', noticeController.getNoticeStats);

// Notification Routes
router.post('/notifications', notificationController.createNotification);
router.get('/notifications', notificationController.getNotifications);
router.get('/notifications/stats/summary', notificationController.getNotificationStats);
router.get('/notifications/received/:userId/:userModel', notificationController.getReceivedNotifications);
router.get('/notifications/:notificationId', notificationController.getNotification);
router.put('/notifications/:notificationId', notificationController.updateNotification);
router.delete('/notifications/:notificationId', notificationController.deleteNotification);

// Notice Template Routes
router.post('/notice-templates', noticeTemplateController.createNoticeTemplate);
router.get('/notice-templates', noticeTemplateController.getNoticeTemplates);
router.put('/notice-templates/:templateId', noticeTemplateController.updateNoticeTemplate);
router.delete('/notice-templates/:templateId', noticeTemplateController.deleteNoticeTemplate);

// Complaint Routes
router.post('/complaints', complaintController.createComplaint);
router.get('/complaints', complaintController.getComplaints);
router.get('/complaints/user/:userId/:userModel', complaintController.getUserComplaints);
router.get('/complaints/:complaintId', complaintController.getComplaint);
router.put('/complaints/:complaintId/status', complaintController.updateComplaintStatus);
router.put('/complaints/:complaintId/assign', complaintController.assignComplaint);
router.put('/complaints/:complaintId/response', complaintController.addResponse);
router.put('/complaints/:complaintId/resolve', complaintController.resolveComplaint);
router.delete('/complaints/:complaintId', complaintController.deleteComplaint);
router.get('/complaints/stats/summary', complaintController.getComplaintStats);

// Communication Log Routes
router.get('/logs', communicationLogController.getCommunicationLogs);
router.get('/logs/user/:userId/:userModel', communicationLogController.getUserLogs);
router.get('/logs/stats/summary', communicationLogController.getCommunicationStats);
router.get('/logs/activity/:userId/:userModel', communicationLogController.getActivitySummary);
router.post('/logs', communicationLogController.createLog);
router.delete('/logs/cleanup', communicationLogController.deleteOldLogs);

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
