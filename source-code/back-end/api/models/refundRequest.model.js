const mongoose = require('mongoose');

const RefundRequestSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    orderCode: {
        type: String,
        required: true
    },
    customerName: {
        type: String,
        required: true
    },
    customerEmail: {
        type: String,
        required: true
    },
    customerPhone: {
        type: String,
        required: true
    },
    bankName: {
        type: String,
        required: true
    },
    bankAccountNumber: {
        type: String,
        required: true
    },
    bankAccountName: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Đang xử lý', 'Đã hoàn tiền', 'Từ chối'],
        default: 'Đang xử lý'
    },
    adminNotes: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    processedAt: {
        type: Date
    }
});

const RefundRequest = mongoose.model('RefundRequest', RefundRequestSchema);

module.exports = RefundRequest; 