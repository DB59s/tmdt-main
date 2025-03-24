const express = require('express');
const router = express.Router();
const OrdersAdminController = require('../../../controllers/admin/orders.admin.controller');
const authMiddleware = require('../../../../middleware/authMiddleware');
const roleMiddleware = require('../../../../middleware/roleMiddleware');


// Lấy tất cả đơn hàng (có phân trang và lọc)
router.get('/', authMiddleware(), roleMiddleware(['1']), OrdersAdminController.getAllOrders);

// Lấy chi tiết đơn hàng theo ID
router.get('/:id', authMiddleware(), roleMiddleware(['1']), OrdersAdminController.getOrderDetail);

// Cập nhật trạng thái đơn hàng
router.patch('/update-status', authMiddleware(), roleMiddleware(['1']), OrdersAdminController.updateOrderStatus);

// Cập nhật nhiều đơn hàng cùng lúc
router.patch('/update-multiple', authMiddleware(), roleMiddleware(['1']), OrdersAdminController.updateMultipleOrders);



module.exports = router; 