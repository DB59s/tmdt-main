const express = require('express');
const router = express.Router();
const profileController = require('../../../controllers/customer/profile.controller');
const { authMiddleware, optionalAuthMiddleware } = require('../../../../middleware/customerAuth');

// Get customer profile (auth optional - can be accessed with customerId param)
router.get('/:customerId?', optionalAuthMiddleware, profileController.getProfile);

// Update customer profile (auth optional - can be updated with customerId param)
router.put('/:customerId?', optionalAuthMiddleware, profileController.updateProfile);

// Register customer (convert anonymous to registered)
router.post('/register/:customerId?', profileController.register);

// Login existing customer
router.post('/login', profileController.login);

module.exports = router; 