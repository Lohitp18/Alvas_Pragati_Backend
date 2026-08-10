const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const onSpotController = require('../controllers/onSpotController');

// Middlewares
const authMiddleware = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const { cacheMiddleware } = require('../middlewares/cacheMiddleware');
const auditLogger = require('../middlewares/auditLogger');

// Helper group roles
const adminRoles = authorizeRoles('super admin', 'sector head');
const spotRoles = authorizeRoles('super admin', 'sector head', 'company');

// @route   POST /api/admin/signin
// @desc    Admin login
// @access  Public
router.post('/signin', adminController.adminLogin);

// @route   GET /api/admin/candidates
// @desc    Get all registered candidates
// @access  Admin Only (Cached)
router.get('/candidates', authMiddleware, adminRoles, auditLogger, cacheMiddleware(30), adminController.getAllCandidates);

// @route   GET /api/admin/companies
// @desc    Get all registered companies
// @access  Admin Only (Cached)
router.get('/companies', authMiddleware, adminRoles, auditLogger, cacheMiddleware(30), adminController.getAllCompanies);

// @route   DELETE /api/admin/candidates/:id
// @desc    Delete a candidate
// @access  Admin Only
router.delete('/candidates/:id', authMiddleware, adminRoles, auditLogger, adminController.deleteCandidate);

// @route   DELETE /api/admin/companies/:id
// @desc    Delete a company
// @access  Admin Only
router.delete('/companies/:id', authMiddleware, adminRoles, auditLogger, adminController.deleteCompany);

// @route   PUT /api/admin/candidates/:id/status
// @desc    Update a candidate's status
// @access  Admin Only
router.put('/candidates/:id/status', authMiddleware, adminRoles, auditLogger, adminController.updateCandidateStatus);

// @route   PUT /api/admin/companies/:id
// @desc    Update a company's details
// @access  Admin Only
router.put('/companies/:id', authMiddleware, adminRoles, auditLogger, adminController.updateCompany);

// @route   PUT /api/admin/companies/:id/status
// @desc    Update a company's status
// @access  Admin Only
router.put('/companies/:id/status', authMiddleware, adminRoles, auditLogger, adminController.updateCompanyStatus);

// @route   POST /api/admin/upload-pdf
// @desc    Upload a PDF file as base64
// @access  Admin Only
router.post('/upload-pdf', authMiddleware, adminRoles, auditLogger, adminController.uploadPdf);

// Credentials management (Admin Only)
router.get('/credentials', authMiddleware, adminRoles, auditLogger, cacheMiddleware(30), adminController.getAllCredentials);
router.post('/credentials', authMiddleware, adminRoles, auditLogger, adminController.createCredential);
router.delete('/credentials/:id', authMiddleware, adminRoles, auditLogger, adminController.deleteCredential);

// Sector and Qualification Links (Admin Only)
router.get('/sector-qual-links', authMiddleware, adminRoles, auditLogger, cacheMiddleware(30), adminController.getSectorQualLinks);
router.post('/sector-qual-links', authMiddleware, adminRoles, auditLogger, adminController.saveSectorQualLink);

// Audit logs (Admin Only)
router.get('/audit-logs', authMiddleware, adminRoles, auditLogger, cacheMiddleware(10), adminController.getAuditLogs);

// On Spot Registration routes
router.post('/onspot/login', onSpotController.onSpotCompanyLogin);
router.get('/onspot/query-student/:uniqueId', authMiddleware, spotRoles, auditLogger, onSpotController.queryStudentByUniqueId);
router.post('/onspot/register', authMiddleware, spotRoles, auditLogger, onSpotController.registerOnSpotStudent);
router.post('/onspot/register-with-data', authMiddleware, spotRoles, auditLogger, onSpotController.registerOnSpotStudentWithData);
router.post('/onspot/register-batch', authMiddleware, spotRoles, auditLogger, onSpotController.registerOnSpotStudentsBatch);
router.get('/onspot/candidate/:uniqueId', authMiddleware, spotRoles, auditLogger, onSpotController.getCandidateSelections);
router.get('/onspot/company/:companyId', authMiddleware, spotRoles, auditLogger, onSpotController.getCompanyOnSpotStudents);
router.put('/onspot/:id', authMiddleware, spotRoles, auditLogger, onSpotController.updateOnSpotStudent);
router.delete('/onspot/:id', authMiddleware, spotRoles, auditLogger, onSpotController.deleteOnSpotStudent);

// Summary & Analytics
router.get('/onspot/summary', authMiddleware, spotRoles, auditLogger, cacheMiddleware(10), onSpotController.getOnSpotSummary);
router.get('/onspot/analytics', authMiddleware, spotRoles, auditLogger, cacheMiddleware(10), onSpotController.getOnSpotAnalytics);

// Feedback submissions (Public, rate-limited)
router.post('/onspot/feedback', onSpotController.createCompanyFeedback);
router.post('/onspot/verify-feedback-token', onSpotController.verifyFeedbackToken);

// Feedback retrieval & deletion (Admin Only)
router.get('/onspot/feedback', authMiddleware, adminRoles, auditLogger, cacheMiddleware(15), onSpotController.getAllFeedback);
router.delete('/onspot/feedback/:id', authMiddleware, adminRoles, auditLogger, onSpotController.deleteCompanyFeedback);

module.exports = router;
