const mongoose = require('mongoose');

const DeviceIdentificationSchema = new mongoose.Schema({
  fingerprint: {
    type: String,
    index: true,
    sparse: true
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
  hardwareInfo: {
    type: Object,
    index: false
  },
  hardwareInfoHash: {
    type: String,
    index: true,
    sparse: true
  },
  devicePixelRatio: Number,
  colorDepth: Number,
  availableMemory: Number,
  canvasFingerprint: String,
  webglInfo: {
    renderer: String,
    vendor: String,
    glVersion: String
  },
  locationInfo: {
    country: String,
    region: String,
    city: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  networkInfo: {
    isp: String,
    connectionType: String,
    downlink: Number,
    rtt: Number
  },
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

DeviceIdentificationSchema.index({ 
  os: 1, 
  device: 1, 
  'screen.width': 1, 
  'screen.height': 1,
  ipAddress: 1
});

const DeviceIdentification = mongoose.model('DeviceIdentification', DeviceIdentificationSchema);

module.exports = DeviceIdentification; 