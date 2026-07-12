const mongoose = require('mongoose');

const OnSpotRegistrationSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  serialNumber: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  college: {
    type: String,
    required: true
  },
  degree: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Shortlisted', 'Selected'],
    required: true
  },
  companySector: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Avoid duplicate registration of same student to same company
OnSpotRegistrationSchema.index({ companyId: 1, candidateId: 1 }, { unique: true });

module.exports = mongoose.model('OnSpotRegistration', OnSpotRegistrationSchema);
