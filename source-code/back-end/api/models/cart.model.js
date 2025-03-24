const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  name: String,
  image: String,
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const CartSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  items: [CartItemSchema],
  status: {
    type: String,
    enum: ['active', 'abandoned', 'converted'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  totalItems: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  }
});

// Update timestamps and totals on save
CartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate totals
  let totalItems = 0;
  let totalAmount = 0;
  
  this.items.forEach(item => {
    totalItems += item.quantity;
    totalAmount += item.price * item.quantity;
  });
  
  this.totalItems = totalItems;
  this.totalAmount = totalAmount;
  
  next();
});

// Methods for cart operations
CartSchema.methods.addItem = function(item) {
  // Check if product already exists in cart
  const existingItemIndex = this.items.findIndex(
    cartItem => cartItem.productId.toString() === item.productId.toString()
  );
  
  if (existingItemIndex > -1) {
    // Update quantity if product already in cart
    this.items[existingItemIndex].quantity += item.quantity;
  } else {
    // Add new item to cart
    this.items.push(item);
  }
  
  return this.save();
};

CartSchema.methods.updateItemQuantity = function(productId, quantity) {
  const item = this.items.find(
    item => item.productId.toString() === productId.toString()
  );
  
  if (!item) {
    throw new Error('Item not found in cart');
  }
  
  if (quantity <= 0) {
    // Remove item if quantity is zero or negative
    return this.removeItem(productId);
  }
  
  item.quantity = quantity;
  return this.save();
};

CartSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(
    item => item.productId.toString() !== productId.toString()
  );
  return this.save();
};

CartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

// Static method to find or create cart
CartSchema.statics.findOrCreateCart = async function(customerId) {
  let cart = await this.findOne({ 
    customerId: customerId,
    status: 'active'
  });
  
  if (!cart) {
    cart = new this({
      customerId: customerId,
      items: []
    });
    await cart.save();
  }
  
  return cart;
};

const Cart = mongoose.model('Cart', CartSchema);

module.exports = Cart; 