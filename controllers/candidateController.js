const Candidate = require('../models/Candidate');
const Company = require('../models/Company');
const SectorQualLink = require('../models/SectorQualLink');
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
      .then(async (smsResult) => {
        console.log('[Registration] Background DOSNET SMS result:', {
          sent: smsResult.sent,
          skipped: smsResult.skipped,
          error: smsResult.error || null,
          variables: smsResult.variables || null,
        });
        if (smsResult.sent) {
          await Candidate.findByIdAndUpdate(newCandidate._id, { registration_sms_sent: true });
        }
      })
      .catch((err) => {
        console.error('[Registration] Background DOSNET SMS error:', err.message);
      });
  } catch (error) {
    console.error('[Registration] Error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// Get Sector and Qualification links for public page
exports.getSectorQualLinks = async (req, res) => {
  try {
    const approvedCompanies = await Company.find({ status: 'Approved' });
    
    // Extract sectors starting with predefined list
    const sectorsSet = new Set(SectorQualLink.PREDEFINED_SECTORS || []);
    approvedCompanies.forEach(c => {
      if (c.industry) sectorsSet.add(c.industry.trim());
    });
    const sectorsList = Array.from(sectorsSet);

    // Extract qualifications starting with predefined list
    const qualsSet = new Set(SectorQualLink.PREDEFINED_QUALIFICATIONS || []);
    approvedCompanies.forEach(c => {
      c.openings?.forEach(op => {
        const quals = Array.isArray(op.qualification) 
          ? op.qualification 
          : (op.qualification ? [op.qualification] : []);
        quals.forEach(q => {
          if (q) qualsSet.add(q.trim());
        });
      });
    });
    const qualsList = Array.from(qualsSet);

    // Fetch existing links from DB
    const savedLinks = await SectorQualLink.find({});
    const linksMap = {};
    savedLinks.forEach(l => {
      linksMap[`${l.type}:${l.name}`] = l.link;
    });

    // Combine lists with links
    const sectors = sectorsList.map(name => ({
      name,
      link: linksMap[`sector:${name}`] || ''
    }));

    const qualifications = qualsList.map(name => ({
      name,
      link: linksMap[`qualification:${name}`] || ''
    }));

    res.status(200).json({ sectors, qualifications });
  } catch (error) {
    console.error('Error fetching public sector and qualification links:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
