const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true }, // Mã đơn hàng
    customerName: { type: String, required: true }, // Tên khách hàng
    customerPhone: { type: String, required: true }, // Số điện thoại khách hàng
    customerEmail: { type: String, required: true }, // Email khách hàng
    shippingAddress: { type: String, required: true }, // Địa chỉ giao hàng
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }, // Tham chiếu đến khách hàng
    status: { type: String, required: true , enum: ['Đang xác nhận', 'Đang đóng gói', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy']}, // Trạng thái đơn hàng
    totalAmountBeforeDiscount: { type: Number }, // Tổng tiền đơn hàng trước khi giảm giá
    totalAmount: { type: Number, required: true }, // Tổng tiền đơn hàng
    paymentMethod: { type: String, required: true , enum: ['Thanh toán khi nhận hàng', 'Thanh toán qua Momo', 'Thanh toán qua VNPay', 'Thanh toán qua Solana', 'Thanh toán qua USDT']}, // Hình thức thanh toán
    paymentStatus: { type: String, required: true , enum: ['Chưa thanh toán', 'Đã thanh toán']}, // Trạng thái thanh toán
    discount: { type: mongoose.Schema.Types.ObjectId, ref: 'Discount' }, // Tham chiếu đến mã giảm giá
    orderDate: { type: Date, default: Date.now }, // Ngày đặt hàng
    cancelDate: { type: Date }, // Ngày hủy đơn hàng
    momoPaymentInfo: {
        partnerCode: { type: String },
        orderId: { type: String },
        requestId: { type: String },
        amount: { type: Number },
        qrCodeUrl: { type: String },
        deeplink: { type: String },
        transactionId: { type: String },
        paymentDate: { type: Date }
    }, // Thông tin thanh toán Momo
    vnpayPaymentInfo: {
        vnpTxnRef: { type: String }, // Mã tham chiếu giao dịch VNPay
        vnpOrderInfo: { type: String }, // Thông tin đơn hàng
        vnpAmount: { type: Number }, // Số tiền thanh toán
        vnpBankCode: { type: String }, // Mã ngân hàng
        vnpTransactionNo: { type: String }, // Mã giao dịch VNPay
        vnpResponseCode: { type: String }, // Mã phản hồi
        vnpPayDate: { type: String }, // Thời gian thanh toán
        vnpCardType: { type: String }, // Loại thẻ/tài khoản
        vnpBankTranNo: { type: String }, // Mã giao dịch ngân hàng
        paymentDate: { type: Date } // Ngày thanh toán
    }, // Thông tin thanh toán VNPay
    solanaPaymentInfo: {
        reference: { type: String }, // Mã tham chiếu giao dịch Solana
        amount: { type: Number }, // Số tiền thanh toán (SOL)
        amountInVnd: { type: Number }, // Số tiền thanh toán (VND)
        paymentUrl: { type: String }, // URL thanh toán Solana
        transactionId: { type: String }, // Mã giao dịch Solana
        verified: { type: Boolean, default: false }, // Trạng thái xác minh
        paymentDate: { type: Date }, // Ngày thanh toán
        createdAt: { type: Date } // Ngày tạo giao dịch
    }, // Thông tin thanh toán Solana
    usdtPaymentInfo: {
        reference: { type: String }, // Mã tham chiếu giao dịch USDT
        amount: { type: Number }, // Số tiền thanh toán (USDT)
        amountInVnd: { type: Number }, // Số tiền thanh toán (VND)
        walletAddress: { type: String }, // Địa chỉ ví nhận tiền
        network: { type: String }, // Mạng lưới (TRC20)
        transactionId: { type: String }, // Mã giao dịch USDT
        verified: { type: Boolean, default: false }, // Trạng thái xác minh
        paymentDate: { type: Date }, // Ngày thanh toán
        createdAt: { type: Date } // Ngày tạo giao dịch
    } // Thông tin thanh toán USDT
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;