const Candidate = require('../models/Candidate');
const Company = require('../models/Company');
const { normalizeOpeningSpecialization } = require('../utils/specialization');
const AdminCredential = require('../models/AdminCredential');

// Admin Login
exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find admin by username
    const admin = await AdminCredential.findOne({ username });
    
    if (!admin) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Check password
    if (admin.password !== password) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // If login successful, return success message (can also generate/return JWT here if needed)
    res.status(200).json({ 
      message: 'Login successful', 
      success: true,
      username: admin.username 
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
      'companyName', 'contactPerson', 'email', 'phone', 'website',
      'industry', 'requirements', 'executives', 'accommodation',
      'transportation', 'interviewProcess', 'openings', 'status',
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
