const express = require('express');
const router = express.Router();
const OrdersController = require('../../../controllers/customer/orders.controller');

// Router đơn hàng khách hàng
router.post('/', OrdersController.createOrder); // Tạo đơn hàng
router.get('/:id', OrdersController.getOrderById); // Lấy thông tin đơn hàng theo ID
router.get('/get-all-order-of-customer/:customerId', OrdersController.getAllOrderOfCustomer);
router.get('/status-summary/:customerId', OrdersController.getOrderStatusSummary); // Lấy thống kê trạng thái đơn hàng
router.patch('/:id/cancel', OrdersController.cancelOrder); // Hủy đơn hàng (endpoint khách hàng)
router.get('/customer/:customerId', OrdersController.getOrdersByCustomer); // Lấy tất cả đơn hàng của khách hàng theo customerId

// Thêm route cho yêu cầu hoàn tiền sau khi hủy đơn hàng đã thanh toán
router.post('/refund-request', OrdersController.createRefundRequest);

// Route để kiểm tra trạng thái hoàn tiền của đơn hàng
router.get('/refund-status/:orderId', OrdersController.getRefundStatus);

// Route lấy đơn hàng của khách hàng với bộ lọc theo trạng thái
router.get('/filter/filter', OrdersController.getFilteredOrdersByCustomer);

module.exports = router; 