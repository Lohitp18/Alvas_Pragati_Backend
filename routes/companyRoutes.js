const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { validateCompanyRegistration, checkValidationErrors } = require('../middlewares/validationMiddleware');

// @route   POST /api/companies/register
// @desc    Register a new company
// @access  Public
router.post('/register', validateCompanyRegistration, checkValidationErrors, companyController.registerCompany);

module.exports = router;
