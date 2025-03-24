const mongoose = require('mongoose');

const orderTrackingSchema = new mongoose.Schema({
    orderId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Order', 
        required: true 
    },
    orderCode: { 
        type: String, 
        required: true 
    }, // Mã đơn hàng (ORD-timestamp)
    status: { 
        type: String, 
        required: true 
    }, // Trạng thái đơn hàng
    description: { 
        type: String 
    }, // Mô tả chi tiết về trạng thái
    location: { 
        type: String 
    }, // Vị trí hiện tại của đơn hàng (nếu có)
    updatedBy: { 
        type: String 
    }, // Người cập nhật (có thể là system hoặc admin)
}, { 
    timestamps: true // Tự động thêm createdAt và updatedAt
});

const OrderTracking = mongoose.model('OrderTracking', orderTrackingSchema);

module.exports = OrderTracking; 