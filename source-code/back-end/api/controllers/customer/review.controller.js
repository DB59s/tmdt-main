const Review = require('../../models/review.model');
const Product = require('../../models/products.model');


const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: envFile });

module.exports.createReview = async (req, res) => {
    try {
        const { productId, customerName, rating, comment } = req.body;

        // Kiểm tra xem sản phẩm có tồn tại không
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Tạo đánh giá mới
        const review = new Review({
            productId,
            customerName,
            rating,
            comment
        });

        await review.save();

        // Thêm đánh giá vào sản phẩm
        product.reviews.push(review._id);
        await product.save();               // Lưu lại sản phẩm                                                                                                                                                                                                             

        res.status(201).json(review);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports.getReviewsByProductId = async (req, res) => {
    try {
        const { productId } = req.params;

        // Lấy tất cả đánh giá cho sản phẩm
        const reviews = await Review.find({ productId }).populate('productId');

        res.status(200).json(reviews);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}; 