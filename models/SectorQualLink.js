const mongoose = require('mongoose');

const sectorQualLinkSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['sector', 'qualification'],
    required: true
  },
  link: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Compound unique index on name and type
sectorQualLinkSchema.index({ name: 1, type: 1 }, { unique: true });

const SectorQualLink = mongoose.model('SectorQualLink', sectorQualLinkSchema);

SectorQualLink.PREDEFINED_SECTORS = [
  'Manufacturing',
  'Logistics',
  'IT&ITES',
  'Banking and Financial Services',
  'Healthcare',
  'Pharmaceuticals',
  'Media',
  'Sales and Retail',
  'Construction',
  'Hospitality',
  'Telecom',
  'Education/NGO'
];

SectorQualLink.PREDEFINED_QUALIFICATIONS = [
  'SSLC',
  'PUC',
  'ITI',
  'Any Degree',
  'Any PG',
  'BPHARM/MPHARMA',
  'BSC/MSC',
  'BCOM/BBM',
  'MCom/MBA',
  'BE/B.TECH',
  'DIPLOMA',
  'MEDICAL/Paramedicals/Nursing/ಹೆಲ್ತ್‌ಕೇರ್‌'
];

module.exports = SectorQualLink;

