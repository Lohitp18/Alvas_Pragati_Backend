const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// @route   POST /api/admin/signin
// @desc    Admin login
// @access  Public
router.post('/signin', adminController.adminLogin);

// @route   GET /api/admin/candidates
// @desc    Get all registered candidates
// @access  Public (in production, secure this with auth middleware)
router.get('/candidates', adminController.getAllCandidates);

// @route   GET /api/admin/companies
// @desc    Get all registered companies
// @access  Public (in production, secure this with auth middleware)
router.get('/companies', adminController.getAllCompanies);

// @route   DELETE /api/admin/candidates/:id
// @desc    Delete a candidate
// @access  Public (in production, secure this with auth middleware)
router.delete('/candidates/:id', adminController.deleteCandidate);

// @route   DELETE /api/admin/companies/:id
// @desc    Delete a company
// @access  Public (in production, secure this with auth middleware)
router.delete('/companies/:id', adminController.deleteCompany);

// @route   PUT /api/admin/candidates/:id/status
// @desc    Update a candidate's status
// @access  Public (in production, secure this with auth middleware)
router.put('/candidates/:id/status', adminController.updateCandidateStatus);

// @route   PUT /api/admin/companies/:id
// @desc    Update a company's details
// @access  Public (in production, secure this with auth middleware)
router.put('/companies/:id', adminController.updateCompany);

// @route   PUT /api/admin/companies/:id/status
// @desc    Update a company's status
// @access  Public (in production, secure this with auth middleware)
router.put('/companies/:id/status', adminController.updateCompanyStatus);

// @route   POST /api/admin/upload-pdf
// @desc    Upload a PDF file as base64
// @access  Public
router.post('/upload-pdf', adminController.uploadPdf);

// Credentials management
router.get('/credentials', adminController.getAllCredentials);
router.post('/credentials', adminController.createCredential);
router.delete('/credentials/:id', adminController.deleteCredential);

// Sector and Qualification Links
router.get('/sector-qual-links', adminController.getSectorQualLinks);
router.post('/sector-qual-links', adminController.saveSectorQualLink);

// Audit logs
router.get('/audit-logs', adminController.getAuditLogs);

// On Spot Registration routes
const onSpotController = require('../controllers/onSpotController');
router.post('/onspot/login', onSpotController.onSpotCompanyLogin);
router.get('/onspot/query-student/:uniqueId', onSpotController.queryStudentByUniqueId);
router.post('/onspot/register', onSpotController.registerOnSpotStudent);
router.post('/onspot/register-batch', onSpotController.registerOnSpotStudentsBatch);
router.get('/onspot/candidate/:uniqueId', onSpotController.getCandidateSelections);
router.get('/onspot/company/:companyId', onSpotController.getCompanyOnSpotStudents);
router.put('/onspot/:id', onSpotController.updateOnSpotStudent);
router.delete('/onspot/:id', onSpotController.deleteOnSpotStudent);
router.get('/onspot/summary', onSpotController.getOnSpotSummary);
router.post('/onspot/feedback', onSpotController.createCompanyFeedback);
router.get('/onspot/feedback', onSpotController.getAllFeedback);
router.delete('/onspot/feedback/:id', onSpotController.deleteCompanyFeedback);
router.get('/onspot/analytics', onSpotController.getOnSpotAnalytics);

router.post('/onspot/verify-feedback-token', onSpotController.verifyFeedbackToken);

module.exports = router;
