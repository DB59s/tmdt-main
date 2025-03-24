const { body, validationResult } = require('express-validator');

// Hàm để thực hiện validate
const validateRegister = [
    body('username')
        .notEmpty().withMessage('Username is required')
        .isLength({ max: 255 }).withMessage('Username must be at most 255 characters long')
        .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username must not contain special characters'),
    
    // Kiểm tra email là không rỗng, đúng định dạng và phải kết thúc bằng @gmail.com
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Email is not valid')
        .matches(/^[a-zA-Z0-9._%+-]+@gmail\.com$/).withMessage('Email must be a valid @gmail.com address'),

    // Kiểm tra password, yêu cầu nó phải chứa ít nhất một chữ thường, một chữ hoa, một số, và một ký tự đặc biệt
    body('password')
        .optional()
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/\d/).withMessage('Password must contain at least one number')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
    
    // Kiểm tra birthday có phải là ngày hợp lệ hay không

    // body('birthday').isDate().withMessage('Birthday is not a valid date'),
];

// Hàm để kiểm tra lỗi
const checkValidationResults = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json({
            code: 400,
            message: errors.array(),
            });
    }
    next();
};

module.exports = { validateRegister, checkValidationResults };
