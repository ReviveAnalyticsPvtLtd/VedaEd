const express = require('express');
const router = express.Router();
const admissionEnquiryController = require('./admissionEnquiryController');
const authMiddleware = require('../../middleware/authMiddleware');

// Enquiries carry guardian names, mobile numbers and email addresses.
router.use(authMiddleware);

router.post('/', admissionEnquiryController.createEnquiry);
router.get('/', admissionEnquiryController.getEnquiries);
router.put('/:id', admissionEnquiryController.updateEnquiry);
router.delete('/:id', admissionEnquiryController.deleteEnquiry);

module.exports = router;
