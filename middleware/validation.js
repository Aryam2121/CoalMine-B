import { body, param, query, validationResult } from 'express-validator';

// Middleware to handle validation errors
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// User validation rules
export const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('role')
    .optional()
    .isIn(['worker', 'Inspector', 'Super admin', 'Mine admin', 'Safety Manager', 'Shift Incharge'])
    .withMessage('Invalid role'),
  
  validate
];

export const validateUserLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  validate
];

// Alert validation
export const validateAlert = [
  body('message')
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Message must be between 5 and 255 characters'),
  
  body('type')
    .isIn(['warning', 'critical'])
    .withMessage('Type must be either warning or critical'),
  
  body('createdBy')
    .optional()
    .isMongoId()
    .withMessage('Invalid creator ID'),
  
  validate
];

// Emergency validation
export const validateEmergency = [
  body('mineId')
    .isMongoId()
    .withMessage('Invalid mine ID'),
  
  body('emergencyType')
    .isIn(['fire', 'explosion', 'gas_leak', 'collapse', 'flooding', 'equipment_failure', 'injury', 'entrapment', 'power_failure', 'other'])
    .withMessage('Invalid emergency type'),
  
  body('severity')
    .isIn(['minor', 'moderate', 'major', 'critical', 'catastrophic'])
    .withMessage('Invalid severity level'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('location.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  
  body('location.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  
  validate
];

// Maintenance validation
export const validateMaintenance = [
  body('task')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Task must be between 5 and 200 characters'),
  
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('dueDate')
    .isISO8601()
    .withMessage('Due date is required and must be valid'),
  
  body('status')
    .optional()
    .isIn(['pending', 'in-progress', 'completed', 'cancelled', 'overdue'])
    .withMessage('Invalid status'),
  
  body('priority')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Priority must be between 1 and 5'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  
  validate
];

// Resource validation
export const validateResource = [
  body('mineId')
    .isMongoId()
    .withMessage('Invalid mine ID'),
  
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('type')
    .isIn(['coal', 'water', 'electricity', 'fuel', 'equipment', 'material', 'other'])
    .withMessage('Invalid resource type'),
  
  body('used')
    .isFloat({ min: 0 })
    .withMessage('Used amount must be a positive number'),
  
  body('available')
    .isFloat({ min: 0 })
    .withMessage('Available amount must be a positive number'),
  
  body('unit')
    .trim()
    .notEmpty()
    .withMessage('Unit is required'),
  
  validate
];

// Training validation
export const validateTraining = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('category')
    .isIn(['safety_procedures', 'equipment_operation', 'emergency_response', 'health_hazards', 'compliance', 'first_aid', 'communication', 'leadership', 'technical_skills'])
    .withMessage('Invalid category'),
  
  body('type')
    .isIn(['video', 'quiz', 'interactive', 'simulation', 'document', 'live_session'])
    .withMessage('Invalid type'),
  
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('Invalid difficulty'),
  
  body('duration')
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive number (in minutes)'),
  
  body('passingScore')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Passing score must be between 0 and 100'),
  
  validate
];

// MongoDB ObjectId validation
export const validateMongoId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  validate
];

// Pagination validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  validate
];

// Date range validation
export const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be valid ISO 8601 format'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be valid ISO 8601 format')
    .custom((endDate, { req }) => {
      if (req.query.startDate && new Date(endDate) < new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  validate
];

export default {
  validate,
  validateUserRegistration,
  validateUserLogin,
  validateAlert,
  validateEmergency,
  validateMaintenance,
  validateResource,
  validateTraining,
  validateMongoId,
  validatePagination,
  validateDateRange
};
