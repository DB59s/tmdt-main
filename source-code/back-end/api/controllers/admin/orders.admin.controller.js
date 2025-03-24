const Order = require('../../models/order.model');
const OrderItem = require('../../models/orderItem.model');
const OrderTracking = require('../../models/orderTracking.model');
const { sendOrderStatusEmail } = require('../../../config/mailer');

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
        
        // Lấy đơn hàng với phân trang
        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
            
        // Đếm tổng số đơn hàng
        const totalOrders = await Order.countDocuments(filter);
        
        res.json({
            orders,
            totalOrders,
            totalPages: Math.ceil(totalOrders / limit),
            currentPage: page
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
        await sendOrderStatusEmail(order.customerEmail, order.orderId, status);
        
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

// Cập nhật nhiều đơn hàng cùng lúc
module.exports.updateMultipleOrders = async (req, res) => {
    try {
        const { orderIds, status, description, location } = req.body;
        
        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return res.status(400).json({
                message: 'Vui lòng cung cấp danh sách ID đơn hàng'
            });
        }
        
        // Cập nhật trạng thái cho nhiều đơn hàng
        const updateResult = await Order.updateMany(
            { _id: { $in: orderIds } },
            { $set: { status } }
        );
        
        // Thêm bản ghi theo dõi cho từng đơn hàng
        const orders = await Order.find({ _id: { $in: orderIds } });
        const trackingRecords = [];
        
        for (const order of orders) {
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
            
            // Gửi email thông báo cho khách hàng
            await sendOrderStatusEmail(order.customerEmail, order.orderId, status);
        }
        
        res.json({
            message: `Đã cập nhật ${updateResult.modifiedCount} đơn hàng thành công`,
            updatedCount: updateResult.modifiedCount,
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

// Hàm trợ giúp để lấy mô tả mặc định dựa trên trạng thái
function getDefaultDescription(status) {
    const descriptions = {
        'Đã đặt hàng': 'Đơn hàng đã được tạo thành công',
        'Đã xác nhận': 'Đơn hàng đã được xác nhận',
        'Đang đóng gói': 'Đơn hàng đang được đóng gói',
        'Đơn vị giao hàng đang lấy hàng': 'Đơn vị vận chuyển đang lấy hàng từ kho',
        'Đang vận chuyển': 'Đơn hàng đang được vận chuyển',
        'Đã đến kho phân loại': 'Đơn hàng đã đến kho phân loại',
        'Đang tới địa chỉ giao hàng': 'Đơn hàng đang được giao đến địa chỉ của bạn, vui lòng chú ý điện thoại',
        'Đã giao hàng': 'Đơn hàng đã được giao thành công',
        'Đã hủy': 'Đơn hàng đã bị hủy'
    };
    
    return descriptions[status] || `Đơn hàng đã được cập nhật sang trạng thái ${status}`;
}
