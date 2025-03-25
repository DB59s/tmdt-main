const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../../middleware/authMiddleware');
const ReturnRequestController = require('../../../controllers/customer/returnRequest.controller');

// Tạo yêu cầu đổi/trả hàng mới
router.post('/', ReturnRequestController.createReturnRequest);

// Lấy danh sách yêu cầu đổi/trả hàng của khách hàng
router.get('/customer/:customerId', ReturnRequestController.getCustomerReturnRequests);

// Lấy chi tiết yêu cầu đổi/trả hàng
router.get('/:id', ReturnRequestController.getReturnRequestDetails);

// Cập nhật yêu cầu đổi/trả hàng
router.put('/:id', ReturnRequestController.updateReturnRequest);

// Hủy yêu cầu đổi/trả hàng
router.post('/:id/cancel', ReturnRequestController.cancelReturnRequest);

module.exports = router; 