const mongoose = require('mongoose');

const adminCredentialSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['super admin', 'sector head'],
    default: 'super admin'
  },
  allowedTabs: {
    type: [String],
    default: []
  }
}, { collection: 'admin_credential' });

module.exports = mongoose.model('AdminCredential', adminCredentialSchema);
