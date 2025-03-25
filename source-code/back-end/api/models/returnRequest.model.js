const mongoose = require('mongoose');

const ReturnRequestSchema = new mongoose.Schema({
    // Thông tin đơn hàng
    orderId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Order', 
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
    customerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Customer' 
    },

    // Loại yêu cầu: 'exchange' (đổi) hoặc 'refund' (trả và hoàn tiền)
    requestType: { 
        type: String, 
        enum: ['exchange', 'refund'], 
        required: true 
    },

    // Lý do đổi/trả hàng
    reason: { 
        type: String, 
        required: true 
    },

    // Hình ảnh minh họa (URLs)
    images: { 
        type: [String], 
        required: true 
    },

    // Danh sách sản phẩm muốn đổi/trả
    items: [{
        productId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Product', 
            required: true 
        },
        quantity: { 
            type: Number, 
            required: true, 
            min: 1 
        },
        price: { 
            type: Number, 
            required: true 
        },
        returnReason: { 
            type: String, 
            required: true 
        }
    }],

    // Thông tin hoàn tiền (chỉ dành cho yêu cầu hoàn tiền)
    refundInfo: {
        bankName: { 
            type: String 
        },
        accountNumber: { 
            type: String 
        },
        accountHolder: { 
            type: String 
        }
    },

    // Tổng tiền hoàn trả
    totalRefundAmount: { 
        type: Number 
    },

    // Trạng thái xử lý
    status: { 
        type: String, 
        enum: ['pending', 'processing', 'approved', 'completed', 'rejected'], 
        default: 'pending' 
    },

    // Ghi chú từ admin
    adminNote: { 
        type: String 
    },

    // Thông tin theo dõi xử lý
    statusHistory: [{
        status: { 
            type: String 
        },
        note: { 
            type: String 
        },
        updatedBy: { 
            type: String 
        },
        updatedAt: { 
            type: Date, 
            default: Date.now 
        }
    }],

    // Sản phẩm thay thế (chỉ dành cho yêu cầu đổi hàng)
    exchangeItems: [{
        productId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Product' 
        },
        quantity: { 
            type: Number, 
            min: 1 
        }
    }]
}, { timestamps: true });

// Phương thức cập nhật trạng thái
ReturnRequestSchema.methods.updateStatus = function(status, note, updater) {
    this.status = status;
    
    this.statusHistory.push({
        status: status,
        note: note || '',
        updatedBy: updater || 'system',
        updatedAt: new Date()
    });
    
    return this.save();
};

const ReturnRequest = mongoose.model('ReturnRequest', ReturnRequestSchema);

module.exports = ReturnRequest; 