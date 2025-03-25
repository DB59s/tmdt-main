const Cart = require('../../models/cart.model');
const Product = require('../../models/products.model'); // Assuming this is your product model

/**
 * Get customer's active cart
 */
exports.getCart = async (req, res) => {
  try {
    const customerId = req.params.customerId || req.customerId;
    
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required'
      });
    }
    
    // Find or create customer's cart
    const cart = await Cart.findOrCreateCart(customerId);
    
    // Populate product details
    await cart.populate('items.productId', 'title price priceBeforeSale onSale thumbnail stock');
    
    // Update cart items with current product prices
    for (const item of cart.items) {
      if (item.productId) {
        // Cập nhật giá dựa trên trạng thái onSale
        const priceToUse = item.productId.onSale ? item.productId.price : item.productId.priceBeforeSale;
        item.price = priceToUse;
        item.onSale = item.productId.onSale;
        item.priceBeforeSale = item.productId.priceBeforeSale;
      }
    }
    
    await cart.save();
    
    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when fetching cart',
      error: error.message
    });
  }
};

/**
 * Add an item to the cart
 */
exports.addItem = async (req, res) => {
  try {
    const customerId = req.params.customerId || req.customerId;
    
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required'
      });
    }
    
    const { productId, quantity } = req.body;
    
    // Validate required fields
    if (!productId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and quantity are required'
      });
    }
    
    // Validate quantity
    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }
    
    // Find product
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Check if product is in stock
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Not enough stock available'
      });
    }
    
    // Xác định giá đúng dựa trên trạng thái giảm giá
    const priceToUse = product.onSale ? product.price : product.priceBeforeSale;
    
    // Find or create customer's cart
    const cart = await Cart.findOrCreateCart(customerId);
    
    // Create cart item
    const cartItem = {
      productId: product._id,
      quantity,
      price: priceToUse,
      priceBeforeSale: product.priceBeforeSale,
      onSale: product.onSale,
      name: product.title,
      image: product.thumbnail
    };
    
    // Add item to cart
    await cart.addItem(cartItem);
    
    // Populate product details
    await cart.populate('items.productId', 'title price priceBeforeSale onSale thumbnail stock');
    
    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: cart
    });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when adding item to cart',
      error: error.message
    });
  }
};

/**
 * Update item quantity in cart
 */
exports.updateItemQuantity = async (req, res) => {
  try {
    const customerId = req.params.customerId || req.customerId;
    const { productId } = req.params;
    const { quantity } = req.body;
    
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required'
      });
    }
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }
    
    if (quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Quantity is required'
      });
    }
    
    // Find product to check stock
    if (quantity > 0) {
      const product = await Product.findById(productId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      
      // Check if product is in stock
      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Not enough stock available'
        });
      }
      
      // Cập nhật giá và trạng thái giảm giá trong giỏ hàng
      const priceToUse = product.onSale ? product.price : product.priceBeforeSale;
      
      // Find customer's cart
      const cart = await Cart.findOne({ 
        customerId, 
        status: 'active'
      });
      
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found'
        });
      }
      
      // Update quantity and price info
      await cart.updateItemQuantity(productId, quantity, priceToUse, product.priceBeforeSale, product.onSale);
    } else {
      // Find customer's cart
      const cart = await Cart.findOne({ 
        customerId, 
        status: 'active'
      });
      
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found'
        });
      }
      
      // Remove item
      await cart.removeItem(productId);
    }
    
    // Get updated cart
    const updatedCart = await Cart.findOne({ 
      customerId, 
      status: 'active'
    });
    
    // Populate product details
    await updatedCart.populate('items.productId', 'title price priceBeforeSale onSale thumbnail stock');
    
    res.status(200).json({
      success: true,
      message: quantity <= 0 ? 'Item removed from cart' : 'Item quantity updated',
      data: updatedCart
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when updating cart item',
      error: error.message
    });
  }
};

/**
 * Remove item from cart
 */
exports.removeItem = async (req, res) => {
  try {
    const customerId = req.params.customerId || req.customerId;
    const { productId } = req.params;
    
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required'
      });
    }
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }
    
    // Find customer's cart
    const cart = await Cart.findOne({ 
      customerId, 
      status: 'active'
    });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    // Remove item from cart
    await cart.removeItem(productId);
    
    // Populate product details
    await cart.populate('items.productId', 'title price priceBeforeSale onSale thumbnail stock');
    
    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: cart
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when removing cart item',
      error: error.message
    });
  }
};

/**
 * Clear cart (remove all items)
 */
exports.clearCart = async (req, res) => {
  try {
    const customerId = req.params.customerId || req.customerId;
    
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required'
      });
    }
    
    // Find customer's cart
    const cart = await Cart.findOne({ 
      customerId, 
      status: 'active'
    });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    // Clear cart
    await cart.clearCart();
    
    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: cart
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when clearing cart',
      error: error.message
    });
  }
}; 