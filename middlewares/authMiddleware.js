const jwt = require('jsonwebtoken');
const AdminCredential = require('../models/AdminCredential');
const Company = require('../models/Company');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change-this-secret');
    
    // Verify user exists in the database to prevent stale sessions
    if (decoded.role === 'company') {
      const company = await Company.findById(decoded.id);
      if (!company || company.status !== 'Approved') {
        return res.status(401).json({ message: 'Session expired or company no longer approved.' });
      }
    } else {
      const admin = await AdminCredential.findById(decoded.id);
      if (!admin) {
        return res.status(401).json({ message: 'Session expired or admin credential deleted.' });
      }
      // If admin username changed, invalidate session
      if (admin.username !== decoded.username) {
        return res.status(401).json({ message: 'Session invalid. Admin credential modified.' });
      }
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return res.status(401).json({ message: 'Session expired or invalid token. Please log in again.' });
  }
};
