const { body, validationResult } = require('express-validator');

const validateCandidateRegistration = [
  body('fullName').notEmpty().withMessage('Full name is required').trim(),
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('phone').notEmpty().withMessage('Phone number is required').isMobilePhone('any').withMessage('Invalid phone number format'),
  body('college').notEmpty().withMessage('College name is required'),
  body('degree').notEmpty().withMessage('Degree is required'),
  body('graduationYear').isInt({ min: 1900, max: 2100 }).withMessage('Valid graduation year is required'),
];

const validateCompanyRegistration = [
  body('companyName').notEmpty().withMessage('Company name is required').trim(),
  body('contactPerson').notEmpty().withMessage('Contact person is required').trim(),
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('phone').notEmpty().withMessage('Phone number is required').isMobilePhone('any').withMessage('Invalid phone number format'),
  body('industry').notEmpty().withMessage('Industry is required'),
];

const checkValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  validateCandidateRegistration,
  validateCompanyRegistration,
  checkValidationErrors
};
