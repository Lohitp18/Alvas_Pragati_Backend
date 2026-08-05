const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { validateCompanyRegistration, checkValidationErrors } = require('../middlewares/validationMiddleware');
const { cacheMiddleware } = require('../middlewares/cacheMiddleware');

// @route   POST /api/companies/register
// @desc    Register a new company
// @access  Public
router.post('/register', validateCompanyRegistration, checkValidationErrors, companyController.registerCompany);

// @route   GET /api/companies/approved
// @desc    Get all approved participating companies
// @access  Public (Cached)
router.get('/approved', cacheMiddleware(60), companyController.getApprovedCompanies);

module.exports = router;
