const Company = require('../models/Company');

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

    const newCompany = new Company({
      companyName,
      contactPerson,
      email,
      phone,
      website,
      industry,
      requirements,
      executives: executives || [],
      accommodation: accommodation || {},
      transportation: transportation || {},
      interviewProcess: interviewProcess || {},
      openings: openings || []
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
