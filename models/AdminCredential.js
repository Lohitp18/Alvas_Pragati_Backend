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
  }
}, { collection: 'admin_credential' });

module.exports = mongoose.model('AdminCredential', adminCredentialSchema);
