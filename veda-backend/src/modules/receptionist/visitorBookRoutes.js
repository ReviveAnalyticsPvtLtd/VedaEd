const express = require('express');
const router = express.Router();
const visitorBookController = require('./visitorBookController');
const authMiddleware = require('../../middleware/authMiddleware');

// The visitor register is a tenant-owned security log.
router.use(authMiddleware);

router.post('/', visitorBookController.createVisitor);
router.get('/', visitorBookController.getVisitors);
router.put('/:id', visitorBookController.updateVisitor);
router.delete('/:id', visitorBookController.deleteVisitor);

module.exports = router;
