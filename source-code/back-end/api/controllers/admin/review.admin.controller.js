const Review = require('../../models/review.model');
const Product = require('../../models/products.model');
const mongoose = require('mongoose');

/**
 * Lấy danh sách đánh giá với các tùy chọn lọc và phân trang
 */
exports.getAllReviews = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            productId, 
            rating, 
            sortBy = 'createdAt', 
            sortOrder = 'desc' 
        } = req.query;
        
        // Xây dựng bộ lọc
        const filter = {};
        
        if (productId) {
            filter.productId = mongoose.Types.ObjectId.isValid(productId) 
                ? new mongoose.Types.ObjectId(productId) 
                : productId;
        }
        
        if (rating) {
            filter.rating = parseInt(rating);
        }
        
        // Thiết lập sắp xếp
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        
        // Tính toán phân trang
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Lấy danh sách đánh giá
        const reviews = await Review.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('productId', 'title thumbnail');
            
        // Đếm tổng số đánh giá
        const totalReviews = await Review.countDocuments(filter);
        
        res.status(200).json({
            success: true,
            reviews,
            totalReviews,
            totalPages: Math.ceil(totalReviews / parseInt(limit)),
            currentPage: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách đánh giá',
            error: error.message
        });
    }
};

/**
 * Lấy chi tiết một đánh giá
 */
exports.getReviewDetails = async (req, res) => {
    try {
        const { id } = req.params;
        
        const review = await Review.findById(id)
            .populate('productId', 'title thumbnail price');
            
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }
        
        res.status(200).json({
            success: true,
            review
        });
    } catch (error) {
        console.error('Error fetching review details:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy chi tiết đánh giá',
            error: error.message
        });
    }
};

/**
 * Xóa một đánh giá
 */
exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Tìm đánh giá để lấy thông tin productId trước khi xóa
        const review = await Review.findById(id);
        
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }
        
        const productId = review.productId;
        
        // Xóa đánh giá
        await Review.findByIdAndDelete(id);
        
        // Cập nhật lại mảng reviews trong sản phẩm
        await Product.findByIdAndUpdate(
            productId,
            { $pull: { reviews: id } }
        );
        
        res.status(200).json({
            success: true,
            message: 'Xóa đánh giá thành công',
            reviewId: id
        });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa đánh giá',
            error: error.message
        });
    }
};

/**
 * Kiểm duyệt một đánh giá (chấp nhận/từ chối)
 * Có thể triển khai trong tương lai nếu có thêm trường isApproved trong model
 */
exports.moderateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { isApproved } = req.body;
        
        if (typeof isApproved !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp trạng thái kiểm duyệt hợp lệ (true/false)'
            });
        }
        
        const review = await Review.findById(id);
        
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }
        
        // Cần thêm trường isApproved vào model Review
        // review.isApproved = isApproved;
        // await review.save();
        
        res.status(200).json({
            success: true,
            message: `Đánh giá đã được ${isApproved ? 'chấp nhận' : 'từ chối'}`,
            review
        });
    } catch (error) {
        console.error('Error moderating review:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi kiểm duyệt đánh giá',
            error: error.message
        });
    }
}; 