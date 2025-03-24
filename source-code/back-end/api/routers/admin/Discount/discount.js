const express = require('express');
const router = express.Router();
const DiscountAdminController = require('../../../controllers/admin/discount.admin.controller');
const authMiddleware = require('../../../../middleware/authMiddleware');
const roleMiddleware = require('../../../../middleware/roleMiddleware');

// Lấy tất cả discount (có phân trang và lọc)
router.get('/', authMiddleware(), roleMiddleware(['1']), DiscountAdminController.getAllDiscounts);

// Lấy chi tiết discount theo ID
router.get('/:id', authMiddleware(), roleMiddleware(['1']), DiscountAdminController.getDiscountById);

// Tạo mới discount
router.post('/', authMiddleware(), roleMiddleware(['1']), DiscountAdminController.createDiscount);

// Cập nhật discount
router.patch('/:id', authMiddleware(), roleMiddleware(['1']), DiscountAdminController.updateDiscount);

// Xóa discount
router.delete('/:id', authMiddleware(), roleMiddleware(['1']), DiscountAdminController.deleteDiscount);

// Xóa nhiều discount cùng lúc
router.delete('/', authMiddleware(), roleMiddleware(['1']), DiscountAdminController.deleteMultipleDiscounts);

module.exports = router;