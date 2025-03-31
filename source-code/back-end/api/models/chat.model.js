const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    // ID của khách hàng tham gia chat
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
        index: true
    },

    // Tên khách hàng
    customerName: {
        type: String,
        required: true
    },

    // Email khách hàng
    customerEmail: {
        type: String,
        required: true
    },

    // Số điện thoại khách hàng
    customerPhone: {
        type: String,
        required: true
    },
    
    
    // ID của admin tham gia chat
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    
    // Tiêu đề cuộc trò chuyện
    title: {
        type: String,
        default: 'Hỗ trợ khách hàng'
    },
    
    // Trạng thái cuộc trò chuyện: active, closed
    status: {
        type: String,
        enum: ['active', 'closed'],
        default: 'active',
        index: true
    },
    
    // Tin nhắn cuối cùng
    lastMessage: {
        type: String,
        default: ''
    },
    
    // Thời gian tin nhắn cuối cùng
    lastMessageTime: {
        type: Date,
        default: Date.now
    },
    
    // Số tin nhắn chưa đọc của customer
    unreadCustomer: {
        type: Number,
        default: 0
    },
    
    // Số tin nhắn chưa đọc của admin
    unreadAdmin: {
        type: Number,
        default: 0
    },
    
    // Thời gian tạo
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat; 