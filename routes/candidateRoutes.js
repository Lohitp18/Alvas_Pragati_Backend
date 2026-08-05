const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const { validateCandidateRegistration, checkValidationErrors } = require('../middlewares/validationMiddleware');

// @route   POST /api/candidates/register
// @desc    Register a new candidate
// @access  Public
router.post('/register', validateCandidateRegistration, checkValidationErrors, candidateController.registerCandidate);

// @route   GET /api/candidates/sector-qual-links
// @desc    Get all sector and qualification links for public helper page
// @access  Public
router.get('/sector-qual-links', candidateController.getSectorQualLinks);

module.exports = router;
