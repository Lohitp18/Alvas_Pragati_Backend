const Candidate = require('../models/Candidate');
const Company = require('../models/Company');
const { normalizeOpeningSpecialization } = require('../utils/specialization');
const AdminCredential = require('../models/AdminCredential');

// Admin Login
// Admin Login
exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find admin by username OR email
    const admin = await AdminCredential.findOne({
      $or: [{ username }, { email: username }]
    });
    
    if (!admin) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Check password
    if (admin.password !== password) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Log audit log
    try {
      const AuditLog = require('../models/AuditLog');
      await AuditLog.create({
        username: admin.username,
        name: admin.name || admin.username,
        email: admin.email || '',
        role: admin.role || 'super admin',
        action: 'Logged In',
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
        userAgent: req.headers['user-agent'] || ''
      });
    } catch (auditErr) {
      console.error('Failed to write audit log:', auditErr);
    }
    
    // If login successful, return success message
    res.status(200).json({ 
      message: 'Login successful', 
      success: true,
      username: admin.username,
      name: admin.name || admin.username,
      email: admin.email || '',
      role: admin.role || 'super admin',
      allowedTabs: admin.allowedTabs || []
    });
  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all candidates
exports.getAllCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ createdAt: -1 });
    res.status(200).json(candidates);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all companies
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    res.status(200).json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a candidate
exports.deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    await Candidate.findByIdAndDelete(id);
    res.status(200).json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a company
exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    await Company.findByIdAndDelete(id);
    res.status(200).json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update company details
exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = [
      'companyName', 'contactPerson', 'designation', 'gender', 'countryCode', 'email', 'phone', 'website',
      'industry', 'requirements', 'executives', 'accommodation',
      'transportation', 'interviewProcess', 'openings', 'status',
      'shortlistedCount', 'selectedCount', 'shortlistedPdf', 'selectedPdf',
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Array.isArray(updates.openings)) {
      updates.openings = updates.openings.map((op) => normalizeOpeningSpecialization(op));
    }
    if (updates.website !== undefined) {
      updates.website = String(updates.website || '').trim();
    }
    if (updates.requirements !== undefined) {
      updates.requirements = String(updates.requirements || '').trim();
    }

    const company = await Company.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.status(200).json({ message: 'Company updated successfully', company });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Company Status
exports.updateCompanyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['Registered', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const company = await Company.findByIdAndUpdate(id, { status }, { new: true });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.status(200).json({ message: 'Company status updated successfully', company });
  } catch (error) {
    console.error('Error updating company status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Candidate Status
exports.updateCandidateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['Registered', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const candidate = await Candidate.findByIdAndUpdate(id, { status }, { new: true });
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.status(200).json({ message: 'Candidate status updated successfully', candidate });
  } catch (error) {
    console.error('Error updating candidate status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Upload PDF file from base64 data
exports.uploadPdf = async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const { base64Data, fileName } = req.body;
    if (!base64Data) {
      return res.status(400).json({ message: 'No file data provided' });
    }

    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ message: 'Invalid base64 string' });
    }

    const fileBuffer = Buffer.from(matches[2], 'base64');
    const uploadDir = path.join(__dirname, '../public/uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    const filePath = path.join(uploadDir, safeFileName);

    fs.writeFileSync(filePath, fileBuffer);

    const fileUrl = `/uploads/${safeFileName}`;
    res.status(200).json({ fileUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'File upload failed', error: error.message });
  }
};

// Get all credentials
exports.getAllCredentials = async (req, res) => {
  try {
    const credentials = await AdminCredential.find({}, { password: 0 }).sort({ createdAt: -1 });
    res.status(200).json(credentials);
  } catch (error) {
    console.error('Error fetching credentials:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new credential
exports.createCredential = async (req, res) => {
  try {
    const { name, email, password, role, allowedTabs } = req.body;
    
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password and role are required' });
    }
    
    // Check if username/email already exists
    const existing = await AdminCredential.findOne({
      $or: [{ username: email }, { email }]
    });
    if (existing) {
      return res.status(400).json({ message: 'Email/Username already exists' });
    }
    
    const newCred = await AdminCredential.create({
      username: email,
      email: email,
      password: password,
      name: name || '',
      role: role,
      allowedTabs: allowedTabs || []
    });
    
    res.status(201).json({
      message: 'Credential created successfully',
      credential: {
        _id: newCred._id,
        name: newCred.name,
        email: newCred.email,
        role: newCred.role,
        allowedTabs: newCred.allowedTabs || []
      }
    });
  } catch (error) {
    console.error('Error creating credential:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete credential
exports.deleteCredential = async (req, res) => {
  try {
    const { id } = req.params;
    await AdminCredential.findByIdAndDelete(id);
    res.status(200).json({ message: 'Credential deleted successfully' });
  } catch (error) {
    console.error('Error deleting credential:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get audit logs
exports.getAuditLogs = async (req, res) => {
  try {
    const AuditLog = require('../models/AuditLog');
    const logs = await AuditLog.find().sort({ timestamp: -1 });
    res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
