const Company = require('../models/Company');
const { normalizeOpeningSpecialization } = require('../utils/specialization');

// Register a new company
exports.registerCompany = async (req, res) => {
  try {
    const { 
      companyName, contactPerson, designation, gender, countryCode, email, phone, website, industry, requirements,
      executives, accommodation, transportation, interviewProcess, openings
    } = req.body;

    // Check if company already exists by email
    const existingCompany = await Company.findOne({ email });
    if (existingCompany) {
      return res.status(400).json({ message: 'Company with this email already exists' });
    }

    const filledOpenings = (openings || [])
      .filter((op) => String(op?.vacancies ?? '').trim() !== '');

    for (let i = 0; i < filledOpenings.length; i += 1) {
      const op = filledOpenings[i];
      if (!String(op?.fromCTC ?? '').trim() || !String(op?.toCTC ?? '').trim()) {
        return res.status(400).json({
          message: `Opening ${i + 1}: Vacancies, From CTC, and To CTC are required.`,
        });
      }
    }

    const normalizedOpenings = filledOpenings.map((op) => normalizeOpeningSpecialization(op));

    const newCompany = new Company({
      companyName,
      contactPerson,
      designation: designation || '',
      gender: gender || '',
      countryCode: countryCode || '+91',
      email,
      phone,
      website: String(website || '').trim(),
      industry,
      requirements: String(requirements || '').trim(),
      executives: executives || [],
      accommodation: accommodation || {},
      transportation: transportation || {},
      interviewProcess: interviewProcess || {},
      openings: normalizedOpenings
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
    const { page, limit } = req.query;

    const totalCount = await Company.countDocuments({ status: 'Approved' });
    res.set('X-Total-Count', totalCount);
    res.set('Access-Control-Expose-Headers', 'X-Total-Count');

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    let query = Company.find({ status: 'Approved' })
      .select('companyName industry openings')
      .sort({ companyName: 1 });

    if (pageNum && limitNum) {
      const skipNum = (pageNum - 1) * limitNum;
      query = query.skip(skipNum).limit(limitNum);
    }

    const companies = await query.lean();
    res.status(200).json(companies);
  } catch (error) {
    console.error('Error fetching approved companies:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
