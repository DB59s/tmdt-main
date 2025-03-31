const express = require('express');
const router = express.Router();
const CategoryAdminController = require('../../../controllers/admin/category.admin.controller');
const authMiddleware = require('../../../../middleware/authMiddleware');
const roleMiddleware = require('../../../../middleware/roleMiddleware');

// Lấy danh sách tất cả danh mục
router.get('/', authMiddleware(), roleMiddleware(['1']), CategoryAdminController.getAllCategories);

// Lấy thông tin một danh mục theo ID
router.get('/:id', authMiddleware(), roleMiddleware(['1']), CategoryAdminController.getCategoryById);

// Tạo danh mục mới
router.post('/', authMiddleware(), roleMiddleware(['1']), CategoryAdminController.createCategory);

// Cập nhật thông tin danh mục
router.patch('/:id', authMiddleware(), roleMiddleware(['1']), CategoryAdminController.updateCategory);

// Xóa danh mục
router.delete('/:id', authMiddleware(), roleMiddleware(['1']), CategoryAdminController.deleteCategory);

// Lấy danh sách sản phẩm theo danh mục
router.get('/:id/products', authMiddleware(), roleMiddleware(['1']), CategoryAdminController.getProductsByCategory);

module.exports = router; 