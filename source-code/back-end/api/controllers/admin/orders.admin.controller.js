const Order = require('../../models/order.model');
const OrderItem = require('../../models/orderItem.model');
const OrderTracking = require('../../models/orderTracking.model');
const { sendOrderStatusEmail  , sendEmailPaymentSuccess} = require('../../../config/mailer');

// Lấy tất cả đơn hàng (có phân trang và lọc)
module.exports.getAllOrders = async (req, res) => {
    try {
        console.log('getAllOrders');
        // Lấy tham số từ query
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Tạo filter từ query params
        const filter = {};
        
        if (req.query.status) {
            filter.status = req.query.status;
        }
        
        if (req.query.paymentStatus) {
            filter.paymentStatus = req.query.paymentStatus;
        }
        
        if (req.query.paymentMethod) {
            filter.paymentMethod = req.query.paymentMethod;
        }
        
        if (req.query.orderId) {
            filter.orderId = { $regex: req.query.orderId, $options: 'i' };
        }
        
        if (req.query.customerName) {
            filter.customerName = { $regex: req.query.customerName, $options: 'i' };
        }
        
        if (req.query.customerPhone) {
            filter.customerPhone = { $regex: req.query.customerPhone, $options: 'i' };
        }
        
        if (req.query.customerEmail) {
            filter.customerEmail = { $regex: req.query.customerEmail, $options: 'i' };
        }
        
        // Lọc theo khoảng thời gian đặt hàng
        if (req.query.startDate && req.query.endDate) {
            filter.orderDate = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        } else if (req.query.startDate) {
            filter.orderDate = { $gte: new Date(req.query.startDate) };
        } else if (req.query.endDate) {
            filter.orderDate = { $lte: new Date(req.query.endDate) };
        }
        
        // Lấy đơn hàng với phân trang
        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
            
        // Đếm tổng số đơn hàng
        const totalOrders = await Order.countDocuments(filter);
        
        // Tính toán thống kê đơn hàng theo trạng thái
        const statusSummary = await Order.aggregate([
            { $match: filter },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        
        // Tính toán thống kê đơn hàng theo trạng thái thanh toán
        const paymentStatusSummary = await Order.aggregate([
            { $match: filter },
            { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }
        ]);
        
        // Format lại dữ liệu thống kê
        const orderStatusSummary = {};
        statusSummary.forEach(item => {
            orderStatusSummary[item._id] = item.count;
        });
        
        const paymentStatusSummary2 = {};
        paymentStatusSummary.forEach(item => {
            paymentStatusSummary2[item._id] = item.count;
        });
        
        res.json({
            orders,
            totalOrders,
            totalPages: Math.ceil(totalOrders / limit),
            currentPage: page,
            summary: {
                orderStatus: orderStatusSummary,
                paymentStatus: paymentStatusSummary2
            }
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            message: 'Đã xảy ra lỗi khi lấy danh sách đơn hàng',
            error: error.message
        });
    }
};

// Lấy chi tiết đơn hàng theo ID
module.exports.getOrderDetail = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Tìm đơn hàng
        const order = await Order.findById(id).populate('discount');
        if (!order) {
            return res.status(404).json({
                message: 'Không tìm thấy đơn hàng'
            });
        }
        
        // Tìm các mục đơn hàng
        const orderItems = await OrderItem.find({ orderId: id }).populate('productId');
        
        // Tìm lịch sử theo dõi đơn hàng
        const trackingHistory = await OrderTracking.find({ orderId: id })
            .sort({ createdAt: -1 });
            
        res.json({
            order,
            orderItems,
            trackingHistory
        });
    } catch (error) {
        console.error('Error fetching order detail:', error);
        res.status(500).json({
            message: 'Đã xảy ra lỗi khi lấy chi tiết đơn hàng',
            error: error.message
        });
    }
};

// Cập nhật trạng thái đơn hàng
module.exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status, description, location } = req.body;
        
        // Kiểm tra xem đơn hàng có tồn tại không
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                message: 'Không tìm thấy đơn hàng'
            });
        }
        
        // Cập nhật trạng thái đơn hàng
        order.status = status;
        
        // Nếu đơn hàng được đánh dấu là 'Đã giao hàng' và phương thức thanh toán là 'Thanh toán khi nhận hàng'
        // thì cập nhật trạng thái thanh toán thành 'Đã thanh toán'
        if (status === 'Đã giao hàng' && order.paymentMethod === 'Thanh toán khi nhận hàng') {
            order.paymentStatus = 'Đã thanh toán';
        }
        
        // Nếu đơn hàng bị hủy, cập nhật ngày hủy
        if (status === 'Đã hủy') {
            order.cancelDate = new Date();
        }
        
        await order.save();
        
        // Thêm bản ghi theo dõi mới
        const orderTracking = new OrderTracking({
            orderId: order._id,
            orderCode: order.orderId,
            status,
            description: description || getDefaultDescription(status),
            location,
            updatedBy: req.user ? req.user.username : 'admin'
        });
        await orderTracking.save();
        
        // Gửi email thông báo cho khách hàng
        try {
            await sendOrderStatusEmail(order.customerEmail, order.orderId, status);
        } catch (emailError) {
            console.error('Error sending email:', emailError);
            // Tiếp tục xử lý mà không dừng luồng nếu email gặp sự cố
        }
        
        res.json({
            message: 'Cập nhật trạng thái đơn hàng thành công',
            order,
            tracking: orderTracking
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            message: 'Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng',
            error: error.message
        });
    }
};

// Cập nhật trạng thái thanh toán
module.exports.updatePaymentStatus = async (req, res) => {
    try {
        const { orderId, paymentStatus, note } = req.body;
        
        // Kiểm tra xem đơn hàng có tồn tại không
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                message: 'Không tìm thấy đơn hàng'
            });
        }
        
        // Kiểm tra trạng thái thanh toán hợp lệ
        if (!['Chưa thanh toán', 'Đã thanh toán'].includes(paymentStatus)) {
            return res.status(400).json({
                message: 'Trạng thái thanh toán không hợp lệ'
            });
        }
        
        // Cập nhật trạng thái thanh toán
        order.paymentStatus = paymentStatus;
        await order.save();
        
        // Thêm bản ghi theo dõi mới
        const orderTracking = new OrderTracking({
            orderId: order._id,
            orderCode: order.orderId,
            status: order.status,
            description: `Cập nhật trạng thái thanh toán: ${paymentStatus}${note ? ` - ${note}` : ''}`,
            updatedBy: req.user ? req.user.username : 'admin'
        });
        await orderTracking.save();
        
        // Gửi email thông báo cho khách hàng
        try {
            await sendEmailPaymentSuccess(order.customerEmail, order.orderId, 'Đã thanh toán');
        } catch (emailError) {
            console.error('Error sending payment success email:', emailError);
            // Tiếp tục xử lý mà không dừng luồng nếu email gặp sự cố
        }
        
        res.json({
            message: 'Cập nhật trạng thái thanh toán thành công',
            order,
            tracking: orderTracking
        });
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({
            message: 'Đã xảy ra lỗi khi cập nhật trạng thái thanh toán',
            error: error.message
        });
    }
};

// Cập nhật nhiều đơn hàng cùng lúc
module.exports.updateMultipleOrders = async (req, res) => {
    try {
        const { orderIds, status, description, location } = req.body;
        
        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return res.status(400).json({
                message: 'Vui lòng cung cấp danh sách ID đơn hàng'
            });
        }
        
        // Lấy các đơn hàng cần cập nhật
        const orders = await Order.find({ _id: { $in: orderIds } });
        
        // Theo dõi các đơn hàng đã cập nhật
        const updatedOrders = [];
        const trackingRecords = [];
        
        // Cập nhật từng đơn hàng
        for (const order of orders) {
            // Cập nhật trạng thái đơn hàng
            order.status = status;
            
            // Nếu đơn hàng được đánh dấu là 'Đã giao hàng' và phương thức thanh toán là 'Thanh toán khi nhận hàng'
            if (status === 'Đã giao hàng' && order.paymentMethod === 'Thanh toán khi nhận hàng') {
                order.paymentStatus = 'Đã thanh toán';
            }
            
            // Nếu đơn hàng bị hủy, cập nhật ngày hủy
            if (status === 'Đã hủy') {
                order.cancelDate = new Date();
            }
            
            await order.save();
            updatedOrders.push(order);
            
            // Thêm bản ghi theo dõi
            const orderTracking = new OrderTracking({
                orderId: order._id,
                orderCode: order.orderId,
                status,
                description: description || getDefaultDescription(status),
                location,
                updatedBy: req.user ? req.user.username : 'admin'
            });
            await orderTracking.save();
            trackingRecords.push(orderTracking);
            
            // Gửi email thông báo
            try {
                await sendOrderStatusEmail(order.customerEmail, order.orderId, status);
            } catch (emailError) {
                console.error(`Error sending email for order ${order.orderId}:`, emailError);
            }
        }
        
        res.json({
            message: `Đã cập nhật ${updatedOrders.length} đơn hàng thành công`,
            updatedCount: updatedOrders.length,
            updatedOrders: updatedOrders.map(order => ({
                _id: order._id,
                orderId: order.orderId,
                status: order.status,
                paymentStatus: order.paymentStatus
            })),
            trackingRecords
        });
    } catch (error) {
        console.error('Error updating multiple orders:', error);
        res.status(500).json({
            message: 'Đã xảy ra lỗi khi cập nhật nhiều đơn hàng',
            error: error.message
        });
    }
};

// Lấy thống kê đơn hàng
module.exports.getOrderStatistics = async (req, res) => {
    try {
        // Tạo filter từ query params
        const filter = {};
        
        if (req.query.startDate && req.query.endDate) {
            filter.orderDate = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        } else if (req.query.startDate) {
            filter.orderDate = { $gte: new Date(req.query.startDate) };
        } else if (req.query.endDate) {
            filter.orderDate = { $lte: new Date(req.query.endDate) };
        }
        
        // Thống kê theo trạng thái đơn hàng
        const orderStatusStats = await Order.aggregate([
            { $match: filter },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        
        // Thống kê theo trạng thái thanh toán
        const paymentStatusStats = await Order.aggregate([
            { $match: filter },
            { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }
        ]);
        
        // Thống kê theo phương thức thanh toán
        const paymentMethodStats = await Order.aggregate([
            { $match: filter },
            { $group: { _id: '$paymentMethod', count: { $sum: 1 } } }
        ]);
        
        // Tính tổng doanh thu từ các đơn hàng đã giao
        const revenueStats = await Order.aggregate([
            { $match: { ...filter, status: 'Đã giao hàng', paymentStatus: 'Đã thanh toán' } },
            { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
        ]);
        
        // Format lại dữ liệu
        const orderStatusData = {};
        orderStatusStats.forEach(item => {
            orderStatusData[item._id] = item.count;
        });
        
        const paymentStatusData = {};
        paymentStatusStats.forEach(item => {
            paymentStatusData[item._id] = item.count;
        });
        
        const paymentMethodData = {};
        paymentMethodStats.forEach(item => {
            paymentMethodData[item._id] = item.count;
        });
        
        const totalRevenue = revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;
        
        res.json({
            orderStatus: orderStatusData,
            paymentStatus: paymentStatusData,
            paymentMethod: paymentMethodData,
            revenue: {
                total: totalRevenue
            }
        });
    } catch (error) {
        console.error('Error fetching order statistics:', error);
        res.status(500).json({
            message: 'Đã xảy ra lỗi khi lấy thống kê đơn hàng',
            error: error.message
        });
    }
};

// Hàm trợ giúp để lấy mô tả mặc định dựa trên trạng thái
function getDefaultDescription(status) {
    const descriptions = {
        'Đang xác nhận': 'Đơn hàng đã được tiếp nhận và đang chờ xác nhận',
        'Đang đóng gói': 'Đơn hàng đã được xác nhận và đang được đóng gói',
        'Đang giao hàng': 'Đơn hàng đã được giao cho đơn vị vận chuyển',
        'Đã giao hàng': 'Đơn hàng đã được giao thành công',
        'Đã hủy': 'Đơn hàng đã bị hủy'
    };
    
    return descriptions[status] || `Đơn hàng đã được cập nhật sang trạng thái ${status}`;
}
