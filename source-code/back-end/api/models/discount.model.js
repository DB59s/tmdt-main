const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true }, // Mã giảm giá
    amount: { type: Number, required: true }, // Số tiền giảm
    quantity: { type: Number, required: true }, // Số lượng mã giảm giá còn lại
    expirationDate: { type: Date, required: true } // Ngày hết hạn
}, { timestamps: true });

const Discount = mongoose.model('Discount', discountSchema);

module.exports = Discount; 