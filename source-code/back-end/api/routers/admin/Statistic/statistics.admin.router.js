const express = require('express');
const router = express.Router();
const StatisticsAdminController = require('../../../controllers/admin/statistic.admin.controller');
const authMiddleware = require('../../../../middleware/authMiddleware');
const roleMiddleware = require('../../../../middleware/roleMiddleware');

// Dashboard tổng quan
router.get('/overview', authMiddleware(), roleMiddleware(['1']), StatisticsAdminController.getOverview);

// Thống kê doanh thu theo thời gian
router.get('/revenue', authMiddleware(), roleMiddleware(['1']), StatisticsAdminController.getRevenueStatistics);

// Thống kê sản phẩm bán chạy
router.get('/top-products', authMiddleware(), roleMiddleware(['1']), StatisticsAdminController.getTopProducts);

// Thống kê tỷ lệ đơn hàng bị đổi/trả
router.get('/return-rate', authMiddleware(), roleMiddleware(['1']), StatisticsAdminController.getReturnRate);

router.get('/user-behavior', authMiddleware(), roleMiddleware(['1']), StatisticsAdminController.getUserBehaviorAnalysis);
router.get('/category-sales', authMiddleware(), roleMiddleware(['1']), StatisticsAdminController.getCategoryStatistics);

module.exports = router;
