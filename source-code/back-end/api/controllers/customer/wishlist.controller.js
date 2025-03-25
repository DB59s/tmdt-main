const Wishlist = require('../../models/wishlist.model');
const Product = require('../../models/products.model');

/**
 * Lấy danh sách wishlist của khách hàng
 */
exports.getWishlist = async (req, res) => {
  try {
    const customerId = req.params.customerId || req.customerId;
    
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required'
      });
    }
    
    // Tìm hoặc tạo wishlist của khách hàng
    const wishlist = await Wishlist.findOrCreateWishlist(customerId);
    
    // Populate thông tin sản phẩm
    await wishlist.populate('items.productId', 'title price priceBeforeSale onSale thumbnail stock rating');
    
    // Cập nhật thông tin giá mới nhất của sản phẩm
    for (const item of wishlist.items) {
      if (item.productId) {
        const priceToUse = item.productId.onSale ? item.productId.price : item.productId.priceBeforeSale;
        item.price = priceToUse;
        item.onSale = item.productId.onSale;
        item.priceBeforeSale = item.productId.priceBeforeSale;
      }
    }
    
    await wishlist.save();
    
    res.status(200).json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when fetching wishlist',
      error: error.message
    });
  }
};

/**
 * Thêm sản phẩm vào wishlist
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
    
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }
    
    // Tìm thông tin sản phẩm
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Xác định giá đúng dựa trên trạng thái giảm giá
    const priceToUse = product.onSale ? product.price : product.priceBeforeSale;
    
    // Tìm hoặc tạo wishlist của khách hàng
    const wishlist = await Wishlist.findOrCreateWishlist(customerId);
    
    // Tạo item để thêm vào wishlist
    const wishlistItem = {
      productId: product._id,
      price: priceToUse,
      priceBeforeSale: product.priceBeforeSale,
      onSale: product.onSale,
      name: product.title,
      image: product.thumbnail
    };
    
    // Thêm sản phẩm vào wishlist
    await wishlist.addItem(wishlistItem);
    
    // Populate thông tin sản phẩm đầy đủ
    await wishlist.populate('items.productId', 'title price priceBeforeSale onSale thumbnail stock rating');
    
    res.status(200).json({
      success: true,
      message: 'Item added to wishlist',
      data: wishlist
    });
  } catch (error) {
    console.error('Error adding item to wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when adding item to wishlist',
      error: error.message
    });
  }
};

/**
 * Xóa sản phẩm khỏi wishlist
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
    
    // Tìm wishlist của khách hàng
    const wishlist = await Wishlist.findOne({ 
      customerId
    });
    
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }
    
    // Xóa sản phẩm khỏi wishlist
    await wishlist.removeItem(productId);
    
    // Populate thông tin sản phẩm
    await wishlist.populate('items.productId', 'title price priceBeforeSale onSale thumbnail stock rating');
    
    res.status(200).json({
      success: true,
      message: 'Item removed from wishlist',
      data: wishlist
    });
  } catch (error) {
    console.error('Error removing item from wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when removing item from wishlist',
      error: error.message
    });
  }
};

/**
 * Kiểm tra sản phẩm có trong wishlist không
 */
exports.checkItem = async (req, res) => {
  try {
    const customerId = req.params.customerId || req.customerId;
    const { productId } = req.params;
    
    if (!customerId || !productId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID and Product ID are required'
      });
    }
    
    // Tìm wishlist của khách hàng
    const wishlist = await Wishlist.findOne({ 
      customerId
    });
    
    if (!wishlist) {
      return res.status(200).json({
        success: true,
        inWishlist: false
      });
    }
    
    // Kiểm tra sản phẩm có trong wishlist không
    const inWishlist = wishlist.hasItem(productId);
    
    res.status(200).json({
      success: true,
      inWishlist
    });
  } catch (error) {
    console.error('Error checking wishlist item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when checking wishlist item',
      error: error.message
    });
  }
};

/**
 * Xóa toàn bộ wishlist
 */
exports.clearWishlist = async (req, res) => {
  try {
    const customerId = req.params.customerId || req.customerId;
    
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required'
      });
    }
    
    // Tìm wishlist của khách hàng
    const wishlist = await Wishlist.findOne({ 
      customerId
    });
    
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }
    
    // Xóa toàn bộ wishlist
    await wishlist.clearWishlist();
    
    res.status(200).json({
      success: true,
      message: 'Wishlist cleared',
      data: wishlist
    });
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when clearing wishlist',
      error: error.message
    });
  }
}; 