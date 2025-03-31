const express = require('express');
const router = express.Router();
const deviceIdentificationController = require('../../../controllers/customer/deviceIdentification.controller');

// Route to identify a device and get or create a customer
router.post('/identify', deviceIdentificationController.identifyDevice);

module.exports = router; 


