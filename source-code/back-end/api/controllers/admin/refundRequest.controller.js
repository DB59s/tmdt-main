const RefundRequest = require('../../models/refundRequest.model');
const Order = require('../../models/order.model');
const { sendOrderStatusEmail } = require('../../../config/mailer');

// Lấy tất cả yêu cầu hoàn tiền
exports.getAllRefundRequests = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        
        // Tạo query object
        const query = {};
        if (status) {
            query.status = status;
        }
        
        // Tính toán skip để phân trang
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Tìm yêu cầu hoàn tiền
        const refundRequests = await RefundRequest.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('orderId', 'orderId totalAmount status');
            
        // Đếm tổng số yêu cầu hoàn tiền
        const total = await RefundRequest.countDocuments(query);
        
        res.status(200).json({
            code: 200,
            message: 'Lấy danh sách yêu cầu hoàn tiền thành công',
            data: {
                refundRequests,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('Error getting refund requests:', error);
        res.status(500).json({
            code: 500,
            message: 'Lỗi khi lấy danh sách yêu cầu hoàn tiền: ' + error.message
        });
    }
};

// Xem chi tiết yêu cầu hoàn tiền
exports.getRefundRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const refundRequest = await RefundRequest.findById(id)
            .populate('orderId', 'orderId totalAmount status customerName customerEmail customerPhone paymentMethod');
            
        if (!refundRequest) {
            return res.status(404).json({
                code: 404,
                message: 'Không tìm thấy yêu cầu hoàn tiền'
            });
        }
        
        res.status(200).json({
            code: 200,
            message: 'Lấy chi tiết yêu cầu hoàn tiền thành công',
            data: refundRequest
        });
    } catch (error) {
        console.error('Error getting refund request details:', error);
        res.status(500).json({
            code: 500,
            message: 'Lỗi khi lấy chi tiết yêu cầu hoàn tiền: ' + error.message
        });
    }
};

// Lấy thống kê yêu cầu hoàn tiền
exports.getRefundStatistics = async (req, res) => {
    try {
        // Tạo filter từ query params
        const filter = {};
        
        // Lọc theo khoảng thời gian 
        if (req.query.startDate && req.query.endDate) {
            filter.createdAt = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        } else if (req.query.startDate) {
            filter.createdAt = { $gte: new Date(req.query.startDate) };
        } else if (req.query.endDate) {
            filter.createdAt = { $lte: new Date(req.query.endDate) };
        }
        
        // Thống kê tổng số yêu cầu hoàn tiền
        const totalRefundRequests = await RefundRequest.countDocuments(filter);
        
        // Thống kê theo trạng thái
        const statusStats = await RefundRequest.aggregate([
            { $match: filter },
            { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
        ]);
        
        // Tính tổng số tiền hoàn
        const totalRefundAmount = await RefundRequest.aggregate([
            { $match: filter },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        // Thống kê theo tháng (trong năm hiện tại hoặc năm được chỉ định)
        const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
        
        const monthlyStats = await RefundRequest.aggregate([
            {
                $match: {
                    ...filter,
                    createdAt: {
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    count: { $sum: 1 },
                    amount: { $sum: '$amount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        // Format lại dữ liệu trạng thái để phù hợp với front-end
        const statusCounts = {
            'Đang xử lý': 0,
            'Đã hoàn tiền': 0,
            'Từ chối': 0
        };
        
        statusStats.forEach(item => {
            statusCounts[item._id] = item.count;
        });
        
        // Format dữ liệu theo tháng
        const monthlyData = Array(12).fill().map((_, i) => ({
            month: i + 1,
            count: 0,
            amount: 0
        }));
        
        monthlyStats.forEach(item => {
            const monthIndex = item._id - 1;
            monthlyData[monthIndex] = {
                month: item._id,
                count: item.count,
                amount: item.amount
            };
        });
        
        // Cấu trúc dữ liệu theo đúng định dạng mà front-end mong đợi
        const responseData = {
            totalRefunds: totalRefundRequests,
            totalRefundAmount: totalRefundAmount.length > 0 ? totalRefundAmount[0].total : 0,
            statusCounts: statusCounts,
            // Giữ thêm dữ liệu chi tiết cho các mục đích khác nếu cần
            details: {
                byStatus: statusStats.reduce((acc, item) => {
                    acc[item._id] = {
                        count: item.count,
                        amount: item.totalAmount
                    };
                    return acc;
                }, {}),
                monthly: monthlyData
            }
        };
        
        res.status(200).json({
            code: 200,
            message: 'Lấy thống kê yêu cầu hoàn tiền thành công',
            data: responseData
        });
    } catch (error) {
        console.error('Error getting refund statistics:', error);
        res.status(500).json({
            code: 500,
            message: 'Lỗi khi lấy thống kê yêu cầu hoàn tiền: ' + error.message
        });
    }
};

// Cập nhật trạng thái yêu cầu hoàn tiền
exports.updateRefundRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;
        
        if (!status) {
            return res.status(400).json({
                code: 400,
                message: 'Trạng thái là bắt buộc'
            });
        }
        
        // Tìm yêu cầu hoàn tiền
        const refundRequest = await RefundRequest.findById(id);
        
        if (!refundRequest) {
            return res.status(404).json({
                code: 404,
                message: 'Không tìm thấy yêu cầu hoàn tiền'
            });
        }
        
        // Cập nhật trạng thái
        refundRequest.status = status;
        if (adminNotes) {
            refundRequest.adminNotes = adminNotes;
        }
        
        // Nếu đã xử lý, cập nhật thời gian xử lý
        if (status !== 'Đang xử lý') {
            refundRequest.processedAt = new Date();
        }
        
        await refundRequest.save();
        
        // Gửi email thông báo cho khách hàng
        try {
            let statusMessage = '';
            switch (status) {
                case 'Đã hoàn tiền':
                    statusMessage = `Chúng tôi đã hoàn tiền thành công cho đơn hàng #${refundRequest.orderCode} của bạn. 
                    Số tiền ${refundRequest.amount.toLocaleString('vi-VN')} VND đã được chuyển vào tài khoản ${refundRequest.bankAccountNumber} - ${refundRequest.bankAccountName} - ${refundRequest.bankName}.
                    ${adminNotes ? 'Ghi chú: ' + adminNotes : ''}`;
                    break;
                case 'Từ chối':
                    statusMessage = `Yêu cầu hoàn tiền cho đơn hàng #${refundRequest.orderCode} của bạn đã bị từ chối. 
                    ${adminNotes ? 'Lý do: ' + adminNotes : 'Vui lòng liên hệ với chúng tôi để biết thêm chi tiết.'}`;
                    break;
                default:
                    statusMessage = `Trạng thái yêu cầu hoàn tiền cho đơn hàng #${refundRequest.orderCode} của bạn đã được cập nhật thành: ${status}`;
            }
            
            await sendOrderStatusEmail(refundRequest.customerEmail, refundRequest.orderCode, statusMessage);
        } catch (emailError) {
            console.error('Error sending refund status email:', emailError);
            // Tiếp tục xử lý dù email gửi thất bại
        }
        
        res.status(200).json({
            code: 200,
            message: 'Cập nhật trạng thái yêu cầu hoàn tiền thành công',
            data: refundRequest
        });
    } catch (error) {
        console.error('Error updating refund request:', error);
        res.status(500).json({
            code: 500,
            message: 'Lỗi khi cập nhật yêu cầu hoàn tiền: ' + error.message
        });
    }
}; 