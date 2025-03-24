const { body, validationResult } = require('express-validator');

// Validate cho cập nhật nhiều người dùng
const validateManyUser = [
    // Kiểm tra id trong body
    body('id')
        .isArray({ min: 1 }).withMessage('ID must be an array with at least one element')
        .custom((value) => {
            if (!value.every(id => typeof id === 'string')) {
                throw new Error('Each ID must be a string');
            }
            return true;
        }),

    body('username')
        .optional()
        .isString().withMessage('Username must be a string')
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),

    body('email')
        .optional()
        .isEmail().withMessage('Invalid email format'),

    body('birthday')
        .optional()
        .isISO8601().withMessage('Invalid date format'),

    body('fullName')
        .optional()
        .isString().withMessage('Full name must be a string')
        .isLength({ min: 1 }).withMessage('Full name cannot be empty'),

    body('role_id')
        .optional(),

    body('status')
        .optional(),

    // Validate mật khẩu
    body('password')
        .optional()
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/\d/).withMessage('Password must contain at least one number')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),

    // Kiểm tra lỗi
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                code: 400,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

module.exports = { validateManyUser };