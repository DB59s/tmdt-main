const mongoose = require('mongoose');

const DeviceIdentificationSchema = new mongoose.Schema({
  fingerprint: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userAgent: {
    type: String,
    required: true
  },
  ipAddress: String,
  browser: String,
  os: String,
  device: String,
  screen: {
    width: Number,
    height: Number
  },
  language: String,
  timezone: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  }
});

const DeviceIdentification = mongoose.model('DeviceIdentification', DeviceIdentificationSchema);

module.exports = DeviceIdentification; 