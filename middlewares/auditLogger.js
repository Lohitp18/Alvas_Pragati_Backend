const AuditLog = require('../models/AuditLog');

module.exports = (req, res, next) => {
  const originalSend = res.send;
  res.send = function (body) {
    const result = originalSend.apply(res, arguments);

    // Check if the user is authenticated and the request was successful
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
      let action = '';
      const method = req.method;
      const path = req.path;

      // Determine action and tab based on route and HTTP method
      if (path.includes('/candidates')) {
        if (method === 'GET') {
          action = 'Tab: Candidate -> Viewed Candidates list';
        } else if (method === 'DELETE') {
          action = `Tab: Candidate -> Deleted Candidate (ID: ${req.params.id || 'unknown'})`;
        } else if (method === 'PUT' && path.includes('/status')) {
          action = `Tab: Candidate -> Updated Candidate Status (ID: ${req.params.id || 'unknown'} to ${req.body.status || 'unknown'})`;
        }
      } else if (path.includes('/companies')) {
        if (method === 'GET') {
          action = 'Tab: Company -> Viewed Companies list';
        } else if (method === 'DELETE') {
          action = `Tab: Company -> Deleted Company (ID: ${req.params.id || 'unknown'})`;
        } else if (method === 'PUT' && path.includes('/status')) {
          action = `Tab: Company -> Updated Company Status (ID: ${req.params.id || 'unknown'} to ${req.body.status || 'unknown'})`;
        } else if (method === 'PUT') {
          action = `Tab: Company -> Updated Company Details (ID: ${req.params.id || 'unknown'})`;
        }
      } else if (path.includes('/credentials')) {
        if (method === 'GET') {
          action = 'Tab: Credentials -> Viewed Admin Credentials list';
        } else if (method === 'POST') {
          action = `Tab: Credentials -> Created Admin Credential for email: ${req.body.email || 'unknown'}`;
        } else if (method === 'DELETE') {
          action = `Tab: Credentials -> Deleted Admin Credential (ID: ${req.params.id || 'unknown'})`;
        }
      } else if (path.includes('/sector-qual-links')) {
        if (method === 'GET') {
          action = 'Tab: Sector/Qual Links -> Viewed Sector/Qualification Links';
        } else if (method === 'POST') {
          action = `Tab: Sector/Qual Links -> Updated Sector/Qualification Link (Name: ${req.body.name || 'unknown'}, Type: ${req.body.type || 'unknown'})`;
        }
      } else if (path.includes('/upload-pdf')) {
        action = `Tab: Company -> Uploaded PDF file (Name: ${req.body.fileName || 'unknown'})`;
      } else if (path.includes('/audit-logs')) {
        if (method === 'GET') {
          action = 'Tab: Audit Logs -> Viewed Audit Logs';
        }
      } else if (path.includes('/onspot')) {
        if (path.includes('/login')) {
          action = `Tab: Spot Portal -> Logged In to Onspot Portal (Company: ${req.body.companyName || 'unknown'})`;
        } else if (path.includes('/query-student')) {
          action = `Tab: Spot Portal -> Queried student (ID: ${req.params.uniqueId || 'unknown'})`;
        } else if (path.includes('/register-batch')) {
          action = `Tab: Spot Portal -> Registered Batch Selections`;
        } else if (path.includes('/register')) {
          action = `Tab: Spot Portal -> Registered Student`;
        } else if (path.includes('/summary')) {
          action = `Tab: Spot Portal -> Viewed Summary`;
        } else if (path.includes('/analytics')) {
          action = `Tab: Spot Portal -> Viewed Analytics`;
        } else if (method === 'DELETE') {
          action = `Tab: Spot Portal -> Deleted student registration (ID: ${req.params.id || 'unknown'})`;
        } else if (method === 'PUT') {
          action = `Tab: Spot Portal -> Updated student registration status (ID: ${req.params.id || 'unknown'})`;
        }
      }

      if (action) {
        AuditLog.create({
          username: req.user.username || req.user.companyName || 'unknown',
          name: req.user.name || req.user.companyName || req.user.username || '',
          email: req.user.email || '',
          role: req.user.role || 'unknown',
          action: action,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
          userAgent: req.headers['user-agent'] || ''
        }).catch(err => console.error('Failed to create audit log:', err));
      }
    }

    return result;
  };

  next();
};
