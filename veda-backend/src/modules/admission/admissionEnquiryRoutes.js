const express = require('express');
const router = express.Router();
const admissionEnquiryController = require('./admissionEnquiryController');
const authMiddleware = require('../../middleware/authMiddleware');
const requireSchoolContext = require('../../middleware/requireSchoolContext');

// Enquiries carry guardian names, mobile numbers and email addresses.
// Every route on this router is tenant-scoped, matching the other admission
// routers (vacancy, interview, entrance exam, application).
router.use(authMiddleware);
router.use(requireSchoolContext);

router.post('/', admissionEnquiryController.createEnquiry);
router.get('/', admissionEnquiryController.getEnquiries);
router.put('/:id', admissionEnquiryController.updateEnquiry);
router.delete('/:id', admissionEnquiryController.deleteEnquiry);

module.exports = router;
