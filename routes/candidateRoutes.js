const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const { validateCandidateRegistration, checkValidationErrors } = require('../middlewares/validationMiddleware');
const { formRateLimiter } = require('../middlewares/rateLimiter');

// @route   POST /api/candidates/register
// @desc    Register a new candidate
// @access  Public
router.post('/register', formRateLimiter, validateCandidateRegistration, checkValidationErrors, candidateController.registerCandidate);

module.exports = router;
