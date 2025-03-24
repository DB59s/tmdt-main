const DeviceIdentification = require('../../models/deviceIdentification.model');
const Customer = require('../../models/customer.model');

/**
 * Identify a device and return the associated customer
 * If the device is new, create a new customer record
 */
exports.identifyDevice = async (req, res) => {
  try {
    const {
      fingerprint,
      userAgent,
      ipAddress,
      browser,
      os,
      device,
      screen,
      language,
      timezone
    } = req.body;

    // Validate required fields
    if (!fingerprint || !userAgent) {
      return res.status(400).json({
        success: false,
        message: 'Fingerprint and userAgent are required'
      });
    }

    // Find or create device identification
    let deviceIdentification = await DeviceIdentification.findOne({ fingerprint });
    
    // If device exists, update lastSeen and return associated customer
    if (deviceIdentification) {
      // Update last seen time
      deviceIdentification.lastSeen = Date.now();
      deviceIdentification.userAgent = userAgent;
      
      // Update optional fields if provided
      if (ipAddress) deviceIdentification.ipAddress = ipAddress;
      if (browser) deviceIdentification.browser = browser;
      if (os) deviceIdentification.os = os;
      if (device) deviceIdentification.device = device;
      if (screen) deviceIdentification.screen = screen;
      if (language) deviceIdentification.language = language;
      if (timezone) deviceIdentification.timezone = timezone;
      
      await deviceIdentification.save();
      
      // Find associated customer
      const customer = await Customer.findById(deviceIdentification.customerId);
      
      if (customer) {
        // Update customer last activity
        customer.lastActivity = Date.now();
        await customer.save();
        
        return res.status(200).json({
          success: true,
          customerId: customer._id,
          isNewCustomer: false,
          isRegistered: customer.isRegistered
        });
      }
    }
    
    // If device doesn't exist or no associated customer, create new records
    if (!deviceIdentification) {
      deviceIdentification = new DeviceIdentification({
        fingerprint,
        userAgent,
        ipAddress,
        browser,
        os,
        device,
        screen,
        language,
        timezone
      });
    }
    
    // Create a new customer record
    const customer = new Customer({
      deviceId: deviceIdentification._id,
      isRegistered: false
    });
    
    await customer.save();
    
    // Link customer to device identification
    deviceIdentification.customerId = customer._id;
    await deviceIdentification.save();
    
    return res.status(201).json({
      success: true,
      customerId: customer._id,
      isNewCustomer: true,
      isRegistered: false
    });
    
  } catch (error) {
    console.error('Error identifying device:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when identifying device',
      error: error.message
    });
  }
}; 