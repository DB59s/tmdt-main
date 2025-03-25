const mongoose = require('mongoose');

const WishlistItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  name: String,
  price: Number,
  priceBeforeSale: Number,
  onSale: Boolean,
  image: String
});

const WishlistSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  items: [WishlistItemSchema],
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
  }
});

// Update timestamps and totals on save
WishlistSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate total items
  this.totalItems = this.items.length;
  
  next();
});

// Methods for wishlist operations
WishlistSchema.methods.addItem = function(item) {
  // Check if product already exists in wishlist
  const existingItemIndex = this.items.findIndex(
    wishlistItem => wishlistItem.productId.toString() === item.productId.toString()
  );
  
  if (existingItemIndex > -1) {
    // Product already in wishlist, update info if needed
    this.items[existingItemIndex].price = item.price;
    this.items[existingItemIndex].priceBeforeSale = item.priceBeforeSale;
    this.items[existingItemIndex].onSale = item.onSale;
    this.items[existingItemIndex].name = item.name;
    this.items[existingItemIndex].image = item.image;
  } else {
    // Add new item to wishlist
    this.items.push(item);
  }
  
  return this.save();
};

WishlistSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(
    item => item.productId.toString() !== productId.toString()
  );
  return this.save();
};

WishlistSchema.methods.clearWishlist = function() {
  this.items = [];
  return this.save();
};

// Check if product is in wishlist
WishlistSchema.methods.hasItem = function(productId) {
  return this.items.some(item => item.productId.toString() === productId.toString());
};

// Static method to find or create wishlist
WishlistSchema.statics.findOrCreateWishlist = async function(customerId) {
  let wishlist = await this.findOne({ 
    customerId: customerId
  });
  
  if (!wishlist) {
    wishlist = new this({
      customerId: customerId,
      items: []
    });
    await wishlist.save();
  }
  
  return wishlist;
};

const Wishlist = mongoose.model('Wishlist', WishlistSchema);

module.exports = Wishlist; 