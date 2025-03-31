const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../../middleware/authMiddleware');
const roleMiddleware = require('../../../../middleware/roleMiddleware');
const ReturnRequestAdminController = require('../../../controllers/admin/returnRequest.admin.controller');

// Lấy danh sách tất cả yêu cầu đổi/trả hàng
router.get('/', authMiddleware(), roleMiddleware(['1']), ReturnRequestAdminController.getAllReturnRequests);

// Lấy thống kê yêu cầu đổi/trả hàng
router.get('/statistics', authMiddleware(), roleMiddleware(['1']), ReturnRequestAdminController.getReturnStatistics);

// Lấy chi tiết yêu cầu đổi/trả hàng
router.get('/:id', authMiddleware(), roleMiddleware(['1']), ReturnRequestAdminController.getReturnRequestDetails);

// Cập nhật trạng thái yêu cầu đổi/trả hàng
router.put('/:id/status', authMiddleware(), roleMiddleware(['1']), ReturnRequestAdminController.updateReturnRequestStatus);

// Thêm sản phẩm thay thế cho yêu cầu đổi hàng
router.post('/:id/exchange-items', authMiddleware(), roleMiddleware(['1']), ReturnRequestAdminController.addExchangeItems);

module.exports = router; 