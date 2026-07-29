const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
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
  qualification: {
    type: String,
    default: ''
  },
  graduationYear: {
    type: Number,
    required: true
  },
  state: {
    type: String,
    default: ''
  },
  district: {
    type: String,
    default: ''
  },
  taluk: {
    type: String,
    default: ''
  },
  stream: {
    type: String,
    default: ''
  },
  specialization: {
    type: String,
    default: ''
  },
  skills: {
    type: [String],
    default: []
  },
  languagesKnown: {
    type: [String],
    default: []
  },
  resumeLink: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Registered', 'Approved', 'Rejected'],
    default: 'Registered'
  },
  serialNumber: {
    type: String,
    unique: true
  },
  registrationData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  registration_sms_sent: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

CandidateSchema.index({ createdAt: -1 });
CandidateSchema.index({ status: 1 });
CandidateSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Candidate', CandidateSchema);
