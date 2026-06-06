const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// @route   POST /api/contact
// @desc    Submit a contact form message
// @access  Public
router.post('/', contactController.submitContact);

module.exports = router;
