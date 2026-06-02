const Candidate = require('../models/Candidate');

// Register a new candidate
exports.registerCandidate = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      college,
      degree,
      qualification,
      graduationYear,
      state,
      district,
      skills,
      languagesKnown,
      resumeLink,
    } = req.body;

    // Check if candidate already exists by email
    const existingCandidate = await Candidate.findOne({ email });
    if (existingCandidate) {
      return res.status(400).json({ message: 'Candidate with this email already exists' });
    }

    // Generate sequential serial number (e.g. 26AL000001)
    let nextNum = 1;
    const lastCandidate = await Candidate.findOne({}, { serialNumber: 1 }).sort({ serialNumber: -1 });
    if (lastCandidate && lastCandidate.serialNumber) {
      const match = lastCandidate.serialNumber.match(/^26AL(\d+)$/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    const paddedNum = String(nextNum).padStart(6, '0');
    const serialNumber = `26AL${paddedNum}`;

    const newCandidate = new Candidate({
      fullName,
      email,
      phone,
      college,
      degree,
      qualification: qualification || degree || '',
      graduationYear,
      state: state || '',
      district: district || '',
      skills: Array.isArray(skills) ? skills : [],
      languagesKnown: Array.isArray(languagesKnown) ? languagesKnown : [],
      resumeLink,
      serialNumber,
    });

    await newCandidate.save();

    res.status(201).json({
      message: 'Candidate registered successfully',
      candidate: newCandidate
    });
  } catch (error) {
    console.error('Error registering candidate:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};
