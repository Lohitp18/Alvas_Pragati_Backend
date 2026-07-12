const mongoose = require('mongoose');

const CompanyFeedbackSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: false // Optional, in case a company is not in the system yet
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  sector: {
    type: String,
    default: ''
  },
  
  // Details of Executives
  executives: [{
    name: { type: String, default: '' },
    designation: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' }
  }],

  // Participation Objectives
  participationObjectives: {
    finalSelection: { type: Boolean, default: false },
    shortlisting: { type: Boolean, default: false },
    otherSpecify: { type: String, default: '' }
  },

  // Feedback Questions
  q1_objectiveAchieved: {
    type: String,
    default: ''
  },
  q2_objectiveAchievedReasons: {
    type: String,
    default: ''
  },
  q3_recommendPeers: {
    type: String,
    default: ''
  },
  q4_recommendPeersReasons: {
    type: String,
    default: ''
  },
  q5_participateNextYear: {
    type: String,
    default: ''
  },
  q6_improvementSuggestions: {
    type: String,
    default: ''
  },
  q7_onlineRegEasy: {
    type: String,
    default: ''
  },
  q8_placementSeasonMonth: {
    type: String,
    default: ''
  },

  // Associations Table
  associations: {
    summerInternship: {
      prefMonth: { type: String, default: '' },
      contactPerson: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' }
    },
    industrialVisit: {
      prefMonth: { type: String, default: '' },
      contactPerson: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' }
    },
    projectWork: {
      prefMonth: { type: String, default: '' },
      contactPerson: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' }
    },
    exclusivePlacement: {
      prefMonth: { type: String, default: '' },
      contactPerson: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' }
    },
    deptSponsorship: {
      prefMonth: { type: String, default: '' },
      contactPerson: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' }
    }
  },

  // Profile of the respondent
  respondent: {
    name: { type: String, default: '' },
    designation: { type: String, default: '' },
    organization: { type: String, default: '' },
    phone: { type: String, default: '' },
    teamMembers: [{
      name: { type: String, default: '' },
      designation: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' }
    }]
  }
}, { timestamps: true });

module.exports = mongoose.model('CompanyFeedback', CompanyFeedbackSchema);
