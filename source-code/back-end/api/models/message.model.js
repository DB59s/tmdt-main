const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    // ID của cuộc trò chuyện
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true,
        index: true
    },
    
    // ID của người gửi tin nhắn
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    
    // Loại người gửi: admin hoặc customer
    senderType: {
        type: String,
        enum: ['admin', 'customer'],
        required: true
    },
    
    // Nội dung tin nhắn
    content: {
        type: String,
        required: true
    },
    
    // Trạng thái đã đọc hay chưa
    isRead: {
        type: Boolean,
        default: false
    },
    
    // Thời gian gửi tin nhắn
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Tạo index để tìm kiếm nhanh
messageSchema.index({ chatId: 1, timestamp: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 