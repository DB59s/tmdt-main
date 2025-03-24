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
    paymentMethod: { type: String, required: true , enum: ['Thanh toán khi nhận hàng', 'Chuyển khoản qua ngân hàng']}, // Hình thức thanh toán
    paymentStatus: { type: String, required: true , enum: ['Chưa thanh toán', 'Đã thanh toán']}, // Trạng thái thanh toán
    discount: { type: mongoose.Schema.Types.ObjectId, ref: 'Discount' }, // Tham chiếu đến mã giảm giá
    orderDate: { type: Date, default: Date.now }, // Ngày đặt hàng
    cancelDate: { type: Date }, // Ngày hủy đơn hàng
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order; 