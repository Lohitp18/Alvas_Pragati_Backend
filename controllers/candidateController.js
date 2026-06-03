const Candidate = require('../models/Candidate');
const { getNextSerialNumber } = require('../utils/serialNumber');
const { sendRegistrationSms } = require('../services/dosnetSms');

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

    console.log('[Registration] New candidate request:', { email, phone, fullName });

    const existingCandidate = await Candidate.findOne({ email });
    if (existingCandidate) {
      console.log('[Registration] Rejected — email already exists:', email);
      return res.status(400).json({ message: 'Candidate with this email already exists' });
    }

    const serialNumber = await getNextSerialNumber();
    console.log('[Registration] Generated serial number:', serialNumber);

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
    console.log('[Registration] Candidate saved successfully:', {
      id: newCandidate._id,
      email: newCandidate.email,
      serialNumber: newCandidate.serialNumber,
    });

    console.log('[Registration] Calling DOSNET SMS API after successful registration...');
    const smsResult = await sendRegistrationSms({
      phone,
      fullName,
      serialNumber,
    });

    console.log('[Registration] DOSNET SMS API result:', {
      sent: smsResult.sent,
      skipped: smsResult.skipped,
      error: smsResult.error || null,
      variables: smsResult.variables || null,
    });

    res.status(201).json({
      message: 'Candidate registered successfully',
      candidate: newCandidate,
      smsSent: smsResult.sent === true,
    });
  } catch (error) {
    console.error('[Registration] Error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};
