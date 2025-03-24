const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // ID sản phẩm
    customerName: { type: String, required: true }, // Tên khách hàng
    rating: { type: Number, required: true, min: 1, max: 5 }, // Đánh giá từ 1 đến 5
    comment: { type: String, required: true }, // Nhận xét
    createdAt: { type: Date, default: Date.now } // Ngày tạo
}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review; 