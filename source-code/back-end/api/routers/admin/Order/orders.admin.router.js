const express = require('express');
const router = express.Router();
const OrdersAdminController = require('../../../controllers/admin/orders.admin.controller');
const authMiddleware = require('../../../../middleware/authMiddleware');
const roleMiddleware = require('../../../../middleware/roleMiddleware');


// Lấy tất cả đơn hàng (có phân trang và lọc)
router.get('/', authMiddleware(), roleMiddleware(['1']), OrdersAdminController.getAllOrders);

// Lấy thống kê đơn hàng
router.get('/list/statistics', authMiddleware(), roleMiddleware(['1']), OrdersAdminController.getOrderStatistics);

// Lấy chi tiết đơn hàng theo ID
router.get('/:id', authMiddleware(), roleMiddleware(['1']), OrdersAdminController.getOrderDetail);

// Cập nhật trạng thái đơn hàng
router.post('/update-status', authMiddleware(), roleMiddleware(['1']), OrdersAdminController.updateOrderStatus);

// Cập nhật trạng thái thanh toán
router.post('/update-payment-status', authMiddleware(), roleMiddleware(['1']), OrdersAdminController.updatePaymentStatus);

// Cập nhật nhiều đơn hàng cùng lúc
router.post('/update-multiple', authMiddleware(), roleMiddleware(['1']), OrdersAdminController.updateMultipleOrders);



module.exports = router; 