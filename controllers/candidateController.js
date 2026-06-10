const Candidate = require('../models/Candidate');
const { getNextSerialNumber } = require('../utils/serialNumber');
const { sendRegistrationSms } = require('../services/dosnetSms');
const {
  resolveCandidateSpecialization,
  resolveCandidateStream,
} = require('../utils/specialization');

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
      registrationData,
      specialization,
      stream,
      taluk,
    } = req.body;

    console.log('[Registration] New candidate request:', { email, phone, fullName });

    const existingCandidate = await Candidate.findOne({ email });
    if (existingCandidate) {
      console.log('[Registration] Rejected — email already exists:', email);
      return res.status(400).json({ message: 'Candidate with this email already exists' });
    }

    const serialNumber = await getNextSerialNumber();
    console.log('[Registration] Generated serial number:', serialNumber);

    const registrationPayload = registrationData || {};

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
      taluk: taluk || registrationPayload.taluk || '',
      stream: resolveCandidateStream(registrationPayload, { stream }),
      specialization: resolveCandidateSpecialization(registrationPayload, { specialization }),
      skills: Array.isArray(skills) ? skills : [],
      languagesKnown: Array.isArray(languagesKnown) ? languagesKnown : [],
      resumeLink,
      serialNumber,
      registrationData: registrationPayload,
    });

    await newCandidate.save();
    console.log('[Registration] Candidate saved successfully:', {
      id: newCandidate._id,
      email: newCandidate.email,
      serialNumber: newCandidate.serialNumber,
    });

    res.status(201).json({
      message: 'Candidate registered successfully',
      candidate: newCandidate,
    });

    // SMS runs in the background so registration responds immediately.
    sendRegistrationSms({
      phone,
      fullName,
      serialNumber: newCandidate.serialNumber,
    })
      .then((smsResult) => {
        console.log('[Registration] Background DOSNET SMS result:', {
          sent: smsResult.sent,
          skipped: smsResult.skipped,
          error: smsResult.error || null,
          variables: smsResult.variables || null,
        });
      })
      .catch((err) => {
        console.error('[Registration] Background DOSNET SMS error:', err.message);
      });
  } catch (error) {
    console.error('[Registration] Error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};
