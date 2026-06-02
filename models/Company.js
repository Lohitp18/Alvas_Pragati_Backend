const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  contactPerson: {
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
  website: {
    type: String,
    trim: true,
    default: ''
  },
  industry: {
    type: String,
    required: true
  },
  requirements: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Registered', 'Approved', 'Rejected'],
    default: 'Registered'
  },
  executives: [{
    name: String,
    designation: String,
    mobile: String,
    email: String,
    gender: String
  }],
  accommodation: {
    accRequired: { type: String, default: 'No' },
    maleExecutives: String,
    femaleExecutives: String,
    checkInDate: String,
    checkOutDate: String
  },
  transportation: {
    transRequired: { type: String, default: 'No' },
    fromLocation: String,
    toLocation: String,
    pickUpDate: String,
    pickUpTime: String,
    numExecs: String
  },
  interviewProcess: {
    interviewRooms: String,
    interviewPanels: String,
    additionalNotes: String,
    onlineExam: { type: String, default: 'No' },
    numComputers: String,
    writtenExam: { type: String, default: 'No' },
    seatingCapacity: String,
    groupDiscussion: { type: String, default: 'No' },
    gdPurpose: String,
    gdRequirements: String
  },
  openings: [{
    vacancies: String,
    designation: String,
    qualification: [String],
    course: [String],
    fromCTC: String,
    toCTC: String,
    cutOff: String,
    jobLocation: String,
    jobDescription: String,
    expFrom: String,
    expTo: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Company', CompanySchema);
