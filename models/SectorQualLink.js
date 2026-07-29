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

module.exports = mongoose.model('SectorQualLink', sectorQualLinkSchema);
