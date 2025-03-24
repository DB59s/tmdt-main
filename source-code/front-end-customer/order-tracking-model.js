// OrderTracking model schema for MongoDB
// This file should be placed in your models directory

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderTrackingSchema = new Schema({
    orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    orderCode: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: [
            'Đã đặt hàng',
            'Đang xác nhận',
            'Đã xác nhận',
            'Đang giao hàng',
            'Đã giao hàng',
            'Đã hủy'
        ]
    },
    description: {
        type: String,
        required: true
    },
    updatedBy: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Create indexes for faster queries
OrderTrackingSchema.index({ orderId: 1 });
OrderTrackingSchema.index({ orderCode: 1 });
OrderTrackingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('OrderTracking', OrderTrackingSchema); 