const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true }, // Mã đơn hàng
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // ID sản phẩm
    quantity: { type: Number, required: true }, // Số lượng sản phẩm
    price: { type: Number, required: true }, // Giá sản phẩm
    priceBeforeSale: { type: Number }, // Giá trước khi giảm giá
    onSale: { type: Boolean, default: false } // Sản phẩm có đang được giảm giá không
}, { timestamps: true });

const OrderItem = mongoose.model('OrderItem', orderItemSchema);

module.exports = OrderItem; 