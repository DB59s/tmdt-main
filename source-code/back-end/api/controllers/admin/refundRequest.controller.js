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