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

// Audit logs
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
