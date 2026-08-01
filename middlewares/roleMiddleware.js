exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role || !allowedRoles.includes(req.user.role)) {
      console.warn(`[Role Authorization] Access Denied: User role "${req.user?.role || 'none'}" not in allowed roles: [${allowedRoles.join(', ')}]`);
      return res.status(403).json({ message: 'Access denied. Unauthorized role.' });
    }
    next();
  };
};
