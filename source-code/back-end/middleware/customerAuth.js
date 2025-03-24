const jwt = require('jsonwebtoken');

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: envFile });

/**
 * Middleware to require authentication for customers
 * Verifies JWT token and attaches customer ID to request
 */
exports.authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      req.customerId = decodedToken.customerId;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Middleware that makes authentication optional
 * If token is provided and valid, attaches customer ID to request
 * If no token or invalid token, allows request to proceed anyway
 */
exports.optionalAuthMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      // No token provided, proceed without authentication
      return next();
    }
    
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      req.customerId = decodedToken.customerId;
    } catch (error) {
      // Invalid token, but still proceed
      console.warn('Invalid token in optional auth:', error.message);
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 