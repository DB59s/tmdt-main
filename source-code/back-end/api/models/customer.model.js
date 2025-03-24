const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const CustomerSchema = new mongoose.Schema({
  // Basic information
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true // Allows null/undefined values (for anonymous users)
  },
  password: {
    type: String,
    // Only required if registered
  },
  name: String,
  phoneNumber: String,
  
  // Device identification
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeviceIdentification',
    required: true
  },
  
  // User status
  isRegistered: {
    type: Boolean,
    default: false
  },
  
  // Address information
  defaultShippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving if it exists and has been modified
CustomerSchema.pre('save', async function(next) {
  // Update lastActivity timestamp
  this.lastActivity = Date.now();
  
  // Only hash password if it exists and has been modified
  if (this.password && this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Method to compare passwords
CustomerSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Method to convert anonymous customer to registered
CustomerSchema.methods.convertToRegistered = async function(userData) {
  this.email = userData.email;
  this.password = userData.password;
  this.name = userData.name;
  this.phoneNumber = userData.phoneNumber;
  this.isRegistered = true;
  
  if (userData.defaultShippingAddress) {
    this.defaultShippingAddress = userData.defaultShippingAddress;
  }
  
  return this.save();
};

const Customer = mongoose.model('Customer', CustomerSchema);

module.exports = Customer; 