const express = require('express');
const router = express.Router();
const ReviewController = require('../../../controllers/customer/review.controller');

router.post('/', ReviewController.createReview); // Tạo đánh giá
router.get('/product/:productId', ReviewController.getReviewsByProductId); // Lấy đánh giá theo ID sản phẩm

module.exports = router; 