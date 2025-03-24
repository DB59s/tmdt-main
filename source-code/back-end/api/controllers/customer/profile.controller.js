const Customer = require('../../models/customer.model');
const jwt = require('jsonwebtoken');

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: envFile });

/**
 * Get customer profile information
 */
exports.getProfile = async (req, res) => {
  try {
    const customerId = req.params.customerId || req.customerId;
    
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required'
      });
    }
    
    const customer = await Customer.findById(customerId).select('-password');
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when fetching customer profile',
      error: error.message
    });
  }
};

/**
 * Update customer profile information
 */
exports.updateProfile = async (req, res) => {
  try {
    const customerId = req.params.customerId || req.customerId;
    
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required'
      });
    }
    
    const customer = await Customer.findById(customerId);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Fields that can be updated
    const updatableFields = [
      'name', 
      'phoneNumber', 
      'defaultShippingAddress'
    ];
    
    // Update fields if they exist in the request
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        customer[field] = req.body[field];
      }
    });
    
    await customer.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: customer
    });
  } catch (error) {
    console.error('Error updating customer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when updating customer profile',
      error: error.message
    });
  }
};

/**
 * Register an anonymous customer (convert to registered user)
 */
exports.register = async (req, res) => {
  try {
    const customerId = req.params.customerId || req.customerId;
    
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required'
      });
    }
    
    const { email, password, name, phoneNumber } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Check if email already exists
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }
    
    const customer = await Customer.findById(customerId);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Convert anonymous customer to registered
    await customer.convertToRegistered({
      email,
      password,
      name,
      phoneNumber
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { customerId: customer._id, email: customer.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(200).json({
      success: true,
      message: 'Registration successful',
      token,
      customerId: customer._id
    });
  } catch (error) {
    console.error('Error registering customer:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when registering customer',
      error: error.message
    });
  }
};

/**
 * Login a registered customer
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Find customer by email
    const customer = await Customer.findOne({ email });
    
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if customer is registered
    if (!customer.isRegistered) {
      return res.status(401).json({
        success: false,
        message: 'Account is not registered'
      });
    }
    
    // Verify password
    const isPasswordValid = await customer.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Update last activity
    customer.lastActivity = Date.now();
    await customer.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { customerId: customer._id, email: customer.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      customerId: customer._id
    });
  } catch (error) {
    console.error('Error logging in customer:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when logging in customer',
      error: error.message
    });
  }
}; 