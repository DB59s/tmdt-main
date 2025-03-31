const express = require('express');
const router = express.Router();
const ReviewAdminController = require('../../../controllers/admin/review.admin.controller');
const authMiddleware = require('../../../../middleware/authMiddleware');
const roleMiddleware = require('../../../../middleware/roleMiddleware');

// Lấy danh sách đánh giá với phân trang và lọc
router.get('/', authMiddleware(), roleMiddleware(['1']), ReviewAdminController.getAllReviews);

// Lấy chi tiết đánh giá
router.get('/:id', authMiddleware(), roleMiddleware(['1']), ReviewAdminController.getReviewDetails);

// Xóa đánh giá
router.delete('/:id', authMiddleware(), roleMiddleware(['1']), ReviewAdminController.deleteReview);

// Kiểm duyệt đánh giá (chấp nhận/từ chối)
router.patch('/:id/moderate', authMiddleware(), roleMiddleware(['1']), ReviewAdminController.moderateReview);

module.exports = router; 