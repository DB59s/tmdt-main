const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true } // Tên danh mục
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category; 