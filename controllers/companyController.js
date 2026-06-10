const Company = require('../models/Company');
const { normalizeOpeningSpecialization } = require('../utils/specialization');

// Register a new company
exports.registerCompany = async (req, res) => {
  try {
    const { 
      companyName, contactPerson, email, phone, website, industry, requirements,
      executives, accommodation, transportation, interviewProcess, openings
    } = req.body;

    // Check if company already exists by email
    const existingCompany = await Company.findOne({ email });
    if (existingCompany) {
      return res.status(400).json({ message: 'Company with this email already exists' });
    }

    const filledOpenings = (openings || [])
      .filter((op) => String(op?.vacancies ?? '').trim() !== '')
      .map((op) => normalizeOpeningSpecialization(op));

    const newCompany = new Company({
      companyName,
      contactPerson,
      email,
      phone,
      website: String(website || '').trim(),
      industry,
      requirements: String(requirements || '').trim(),
      executives: executives || [],
      accommodation: accommodation || {},
      transportation: transportation || {},
      interviewProcess: interviewProcess || {},
      openings: filledOpenings
    });

    await newCompany.save();

    res.status(201).json({
      message: 'Company registered successfully',
      company: newCompany
    });
  } catch (error) {
    console.error('Error registering company:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// Get all approved companies (public)
exports.getApprovedCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ status: 'Approved' })
      .select('companyName industry openings')
      .sort({ companyName: 1 });

    res.status(200).json(companies);
  } catch (error) {
    console.error('Error fetching approved companies:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
