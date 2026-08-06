const Company = require('../models/Company');
const Candidate = require('../models/Candidate');
const OnSpotRegistration = require('../models/OnSpotRegistration');
const CompanyFeedback = require('../models/CompanyFeedback');
const jwt = require('jsonwebtoken');

// Company login for On Spot Portal
exports.onSpotCompanyLogin = async (req, res) => {
  try {
    const { companyName, password } = req.body;
    if (!companyName || !password) {
      return res.status(400).json({ message: 'Company name/email and password are required' });
    }

    const trimmed = companyName.trim();
    const company = await Company.findOne({
      $or: [
        { companyName: { $regex: new RegExp(`^${trimmed}$`, 'i') } },
        { email: trimmed.toLowerCase() }
      ],
      status: 'Approved'
    });

    if (!company) {
      return res.status(401).json({ message: 'Company not found or not approved' });
    }

    // Verify password
    // Fallback: If company has no password set, use companyName as fallback
    const expectedPassword = company.password || company.companyName;
    if (password.trim() !== expectedPassword.trim()) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT for company
    const token = jwt.sign(
      {
        id: company._id,
        companyName: company.companyName,
        role: 'company'
      },
      process.env.JWT_SECRET || 'change-this-secret',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      company: {
        _id: company._id,
        companyName: company.companyName
      }
    });
  } catch (error) {
    console.error('Error in on-spot login:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Query student by serialNumber, email, or phone
exports.queryStudentByUniqueId = async (req, res) => {
  try {
    const { uniqueId } = req.params;
    if (!uniqueId) {
      return res.status(400).json({ message: 'Student unique number is required' });
    }

    const cleanedId = uniqueId.trim();
    const candidate = await Candidate.findOne({
      $or: [
        { serialNumber: cleanedId },
        { email: cleanedId.toLowerCase() },
        { phone: cleanedId }
      ]
    });

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.status(200).json(candidate);
  } catch (error) {
    console.error('Error querying student:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Register a student for a company on-spot
exports.registerOnSpotStudent = async (req, res) => {
  try {
    const { companyId, companyName, candidateId, status } = req.body;

    if (!companyId || !companyName || !candidateId || !status) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if candidate exists
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Check if already registered for this company
    const existing = await OnSpotRegistration.findOne({ companyId, candidateId });
    if (existing) {
      return res.status(400).json({ message: 'This candidate is already registered for your company' });
    }

    // Fetch company sector
    const companyDoc = await Company.findById(companyId);
    const companySector = companyDoc ? companyDoc.industry || 'Unknown' : 'Unknown';

    const registration = new OnSpotRegistration({
      companyId,
      companyName,
      candidateId,
      serialNumber: candidate.serialNumber,
      fullName: candidate.fullName,
      email: candidate.email,
      phone: candidate.phone,
      college: candidate.college,
      degree: candidate.degree,
      status,
      companySector
    });

    await registration.save();

    res.status(201).json({
      message: 'Student registered successfully',
      registration
    });
  } catch (error) {
    console.error('Error registering student on-spot:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all on-spot students for a company
exports.getCompanyOnSpotStudents = async (req, res) => {
  try {
    const { companyId } = req.params;
    const registrations = await OnSpotRegistration.find({ companyId }).sort({ createdAt: -1 });
    res.status(200).json(registrations);
  } catch (error) {
    console.error('Error fetching company registrations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update an on-spot student selection status
exports.updateOnSpotStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Shortlisted', 'Selected', 'Appeared'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const registration = await OnSpotRegistration.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!registration) {
      return res.status(404).json({ message: 'Registration record not found' });
    }

    res.status(200).json({
      message: 'Status updated successfully',
      registration
    });
  } catch (error) {
    console.error('Error updating registration status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete an on-spot registration
exports.deleteOnSpotStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const registration = await OnSpotRegistration.findByIdAndDelete(id);

    if (!registration) {
      return res.status(404).json({ message: 'Registration record not found' });
    }

    res.status(200).json({ message: 'Registration deleted successfully' });
  } catch (error) {
    console.error('Error deleting registration:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get summary counts for all approved companies
exports.getOnSpotSummary = async (req, res) => {
  try {
    const companies = await Company.find({ status: 'Approved' }).sort({ companyName: 1 });
    const registrations = await OnSpotRegistration.aggregate([
      {
        $group: {
          _id: '$companyId',
          count: { $sum: 1 },
          shortlistedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Shortlisted'] }, 1, 0] }
          },
          selectedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Selected'] }, 1, 0] }
          }
        }
      }
    ]);

    const countsMap = {};
    registrations.forEach(r => {
      countsMap[r._id.toString()] = {
        count: r.count,
        shortlistedCount: r.shortlistedCount,
        selectedCount: r.selectedCount
      };
    });

    const summary = companies.map(c => {
      const qualifications = Array.from(new Set(
        (c.openings || []).flatMap(op => op.qualification || [])
      ));
      return {
        _id: c._id,
        companyName: c.companyName,
        industry: c.industry,
        qualifications,
        studentCount: countsMap[c._id.toString()]?.count || 0,
        shortlistedCount: countsMap[c._id.toString()]?.shortlistedCount || 0,
        selectedCount: countsMap[c._id.toString()]?.selectedCount || 0
      };
    });

    res.status(200).json(summary);
  } catch (error) {
    console.error('Error fetching on-spot summary:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Log company feedback
exports.createCompanyFeedback = async (req, res) => {
  try {
    const {
      companyId,
      companyName,
      sector,
      executives,
      participationObjectives,
      q1_objectiveAchieved,
      q2_objectiveAchievedReasons,
      q3_recommendPeers,
      q4_recommendPeersReasons,
      q5_participateNextYear,
      q6_improvementSuggestions,
      q7_onlineRegEasy,
      q8_placementSeasonMonth,
      associations,
      respondent
    } = req.body;

    if (!companyName) {
      return res.status(400).json({ message: 'Company Name is required' });
    }

    const feedback = new CompanyFeedback({
      companyId: companyId || null,
      companyName,
      sector: sector || '',
      executives: executives || [],
      participationObjectives: participationObjectives || {},
      q1_objectiveAchieved: q1_objectiveAchieved || '',
      q2_objectiveAchievedReasons: q2_objectiveAchievedReasons || '',
      q3_recommendPeers: q3_recommendPeers || '',
      q4_recommendPeersReasons: q4_recommendPeersReasons || '',
      q5_participateNextYear: q5_participateNextYear || '',
      q6_improvementSuggestions: q6_improvementSuggestions || '',
      q7_onlineRegEasy: q7_onlineRegEasy || '',
      q8_placementSeasonMonth: q8_placementSeasonMonth || '',
      associations: associations || {},
      respondent: respondent || {}
    });

    await feedback.save();

    res.status(201).json({
      message: 'Feedback logged successfully',
      feedback
    });
  } catch (error) {
    console.error('Error logging feedback:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all logged company feedback
exports.getAllFeedback = async (req, res) => {
  try {
    const feedbackList = await CompanyFeedback.find({})
      .populate('companyId', 'openings industry')
      .sort({ createdAt: -1 });
    res.status(200).json(feedbackList);
  } catch (error) {
    console.error('Error getting feedback:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete feedback entry
exports.deleteCompanyFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await CompanyFeedback.findByIdAndDelete(id);

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback entry not found' });
    }

    res.status(200).json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Sector-wise & Qualification-wise stats
exports.getOnSpotAnalytics = async (req, res) => {
  try {
    const sectorStats = await OnSpotRegistration.aggregate([
      { $group: { _id: '$companySector', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const qualStats = await OnSpotRegistration.aggregate([
      { $group: { _id: '$degree', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      sectorWise: sectorStats.map(s => ({ name: s._id || 'Unknown', count: s.count })),
      qualificationWise: qualStats.map(q => ({ name: q._id || 'Unknown', count: q.count }))
    });
  } catch (error) {
    console.error('Error fetching on-spot analytics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify feedback access token
exports.verifyFeedbackToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (token === '696293') {
      return res.status(200).json({ success: true, message: 'Access granted' });
    }
    return res.status(401).json({ success: false, message: 'Invalid access token' });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Register multiple students for a company on-spot (batch)
exports.registerOnSpotStudentsBatch = async (req, res) => {
  try {
    const { companyId, companyName, selections } = req.body; // selections is [{ candidateId, status }]

    if (!companyId || !companyName || !Array.isArray(selections)) {
      return res.status(400).json({ message: 'Company details and selections array are required' });
    }

    const companyDoc = await Company.findById(companyId);
    const companySector = companyDoc ? companyDoc.industry || 'Unknown' : 'Unknown';

    const results = [];
    const errors = [];

    for (const item of selections) {
      const { candidateId, status } = item;
      if (!candidateId || !status) continue;

      try {
        // Check if candidate exists
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
          errors.push({ candidateId, message: 'Candidate not found' });
          continue;
        }

        // Check if already registered for this company
        const existing = await OnSpotRegistration.findOne({ companyId, candidateId });
        if (existing) {
          // Update status if it changed
          if (existing.status !== status) {
            existing.status = status;
            await existing.save();
            results.push(existing);
          } else {
            results.push(existing);
          }
          continue;
        }

        const registration = new OnSpotRegistration({
          companyId,
          companyName,
          candidateId,
          serialNumber: candidate.serialNumber,
          fullName: candidate.fullName,
          email: candidate.email,
          phone: candidate.phone,
          college: candidate.college,
          degree: candidate.degree,
          status,
          companySector
        });

        await registration.save();
        results.push(registration);
      } catch (err) {
        errors.push({ candidateId, message: err.message });
      }
    }

    res.status(200).json({
      message: `Batch registration processed. Success: ${results.length}, Failed: ${errors.length}`,
      results,
      errors
    });
  } catch (error) {
    console.error('Error in batch registration:', error);
    res.status(500).json({ message: 'Server error during batch registration', error: error.message });
  }
};

// Get selection status for a candidate (by serialNumber, email, or phone)
exports.getCandidateSelections = async (req, res) => {
  try {
    const { uniqueId } = req.params;
    if (!uniqueId) {
      return res.status(400).json({ message: 'Candidate unique ID is required' });
    }
    const cleanedId = uniqueId.trim();
    
    // Find candidate first to get their profile
    const candidate = await Candidate.findOne({
      $or: [
        { serialNumber: cleanedId },
        { email: cleanedId.toLowerCase() },
        { phone: cleanedId }
      ]
    });
    
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    
    // Find all selections/shortlists for this candidate
    const selections = await OnSpotRegistration.find({ candidateId: candidate._id }).sort({ createdAt: -1 }).lean();
    res.status(200).json({
      candidate,
      selections
    });
  } catch (error) {
    console.error('Error fetching candidate selections:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
