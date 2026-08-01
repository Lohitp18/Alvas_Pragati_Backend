const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { formRateLimiter } = require('../middlewares/rateLimiter');

// @route   POST /api/contact
// @desc    Submit a contact form message
// @access  Public
router.post('/', formRateLimiter, contactController.submitContact);

module.exports = router;
