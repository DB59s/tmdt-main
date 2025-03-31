const express = require('express');
const router = express.Router();
const refundRequestController = require('../../../controllers/admin/refundRequest.controller');
const authMiddleware = require('../../../../middleware/authMiddleware');
const roleMiddleware = require('../../../../middleware/roleMiddleware');
// Kiểm tra quyền admin cho tất cả các route

// Route lấy tất cả yêu cầu hoàn tiền
router.get('/', authMiddleware(), roleMiddleware(['1']), refundRequestController.getAllRefundRequests);

// Route lấy thống kê yêu cầu hoàn tiền
router.get('/statistics', authMiddleware(), roleMiddleware(['1']), refundRequestController.getRefundStatistics);

// Route lấy chi tiết yêu cầu hoàn tiền
router.get('/refund-request/:id',authMiddleware(), roleMiddleware(['1']), refundRequestController.getRefundRequestById);

// Route cập nhật trạng thái yêu cầu hoàn tiền
router.put('/:id', authMiddleware(), roleMiddleware(['1']), refundRequestController.updateRefundRequest);

module.exports = router; 