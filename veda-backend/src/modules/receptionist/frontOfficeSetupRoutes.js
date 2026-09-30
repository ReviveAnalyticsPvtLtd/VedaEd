const express = require('express');
const router = express.Router();
const controller = require('./frontOfficeSetupController');
const authMiddleware = require('../../middleware/authMiddleware');

// Front office setup lists are school-owned configuration.
router.use(authMiddleware);

router.get('/', controller.getSetups);
router.post('/', controller.createSetup);
router.put('/:id', controller.updateSetup);
router.delete('/:id', controller.deleteSetup);

module.exports = router;
