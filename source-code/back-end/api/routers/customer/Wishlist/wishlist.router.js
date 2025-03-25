const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../../middleware/authMiddleware');
const WishlistController = require('../../../controllers/customer/wishlist.controller');

// Lấy danh sách wishlist của khách hàng
router.get('/:customerId', WishlistController.getWishlist);

// Thêm sản phẩm vào wishlist
router.post('/:customerId/items', WishlistController.addItem);

// Xóa sản phẩm khỏi wishlist
router.delete('/:customerId/items/:productId', WishlistController.removeItem);

// Kiểm tra sản phẩm có trong wishlist không
router.get('/:customerId/check/:productId', WishlistController.checkItem);

// Xóa toàn bộ wishlist
router.delete('/:customerId', WishlistController.clearWishlist);

module.exports = router; 