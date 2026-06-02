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
  }
}, { timestamps: true });

module.exports = mongoose.model('Candidate', CandidateSchema);
