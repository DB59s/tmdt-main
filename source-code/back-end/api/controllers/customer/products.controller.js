const Product = require('../../models/products.model');
const mongoose = require('mongoose');

module.exports.getAllProducts = async (req, res) => {
    try {
        // Lấy tiêu chí tìm kiếm từ query
        const filter = {};
        
        // Tìm kiếm theo tên sản phẩm
        if (req.query.search) {
            filter.title = new RegExp(req.query.search.trim(), 'i');
        }
        
        // Lọc theo danh mục
        if (req.query.category) {
            filter.categoryId = req.query.category;
        }
        
        // Lọc theo khoảng giá
        if (req.query.minPrice || req.query.maxPrice) {
            filter.price = {};
            if (req.query.minPrice) {
                filter.price.$gte = parseInt(req.query.minPrice);
            }
            if (req.query.maxPrice) {
                filter.price.$lte = parseInt(req.query.maxPrice);
            }
        }

        // Lọc theo trạng thái sale
        if (req.query.onSale === 'true') {
            filter.onSale = true;
        } else if (req.query.onSale === 'false') {
            filter.onSale = false;
        }

        // Lấy thông tin phân trang từ query
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Xác định cách sắp xếp
        let sort = {};
        
        // Các option sort từ frontend
        switch(req.query.sort) {
            case 'newest':
                sort = { createdAt: -1 };
                break;
            case 'oldest':
                sort = { createdAt: 1 };
                break;
            case 'price-low':
                sort = { price: 1 };
                break;
            case 'price-high':
                sort = { price: -1 };
                break;
            case 'name-asc':
                sort = { name: 1 };
                break;
            case 'name-desc':
                sort = { name: -1 };
                break;
            case 'discount-high': // Thêm tùy chọn sắp xếp theo mức giảm giá
                sort = { discountPercentage: -1 };
                break;
            default:
                sort = { createdAt: -1 };
        }

        // Tìm tất cả sản phẩm
        const products = await Product.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit);
        
        const totalProducts = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / limit);

        res.status(200).json({
            products,
            totalProducts,
            totalPages,
            currentPage: page,
            limit
        });
    } catch (error) {
        res.status(400).json({
            code: 400,
            message: error.message
        });
    }
};


module.exports.getProductById = async (req, res) => {
    try {
        console.log("get product by id");
        console.log(req.params.id);
        const product = await Product.findById(req.params.id);
        res.status(200).json(product);
    } catch (error) {
        res.status(400).json({
            code: 400,
            message: error.message
        });
    }
};  

/**
 * Lấy danh sách sản phẩm đang sale
 */
module.exports.getOnSaleProducts = async (req, res) => {
    try {
        // Lọc lấy sản phẩm đang sale
        const filter = { onSale: true };
        
        // Lọc theo danh mục nếu có
        if (req.query.category) {
            filter.categoryId = req.query.category;
        }
        
        // Lọc theo mức giảm giá tối thiểu (nếu có)
        if (req.query.minDiscount) {
            filter.discountPercentage = { $gte: parseInt(req.query.minDiscount) };
        }
        
        // Lấy thông tin phân trang từ query
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Xác định cách sắp xếp
        let sort = {};
        
        // Các option sort từ frontend
        switch(req.query.sort) {
            case 'discount-high': 
                sort = { discountPercentage: -1 };
                break;
            case 'price-low':
                sort = { price: 1 };
                break;
            case 'price-high':
                sort = { price: -1 };
                break;
            case 'newest':
                sort = { createdAt: -1 };
                break;
            default:
                sort = { discountPercentage: -1 }; // Mặc định sắp xếp theo mức giảm giá cao nhất
        }
        
        // Tìm sản phẩm đang sale
        const products = await Product.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit);
        
        const totalProducts = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / limit);
        
        res.status(200).json({
            products,
            totalProducts,
            totalPages,
            currentPage: page,
            limit
        });
    } catch (error) {
        res.status(400).json({
            code: 400,
            message: error.message
        });
    }
};

/**
 * Lấy 6 danh mục có số lượng sản phẩm nhiều nhất
 */
module.exports.getTopCategories = async (req, res) => {
    try {
        // Nhóm sản phẩm theo categoryId và đếm số lượng
        const categories = await Product.aggregate([
            { 
                $group: {
                    _id: "$categoryId",
                    count: { $sum: 1 },
                    products: { $push: "$$ROOT" }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 6 }
        ]);

        // Lấy thông tin chi tiết của từng category
        const topCategories = await Promise.all(categories.map(async (category) => {
            const categoryInfo = await mongoose.model('Category').findById(category._id);
            if (categoryInfo) {
                // Lấy một sản phẩm đại diện cho danh mục (sản phẩm đầu tiên)
                const sampleProduct = category.products[0];
                return {
                    _id: category._id,
                    name: categoryInfo.name,
                    productCount: category.count,
                    thumbnail: sampleProduct ? sampleProduct.thumbnail : null
                };
            }
            return null;
        }));

        // Lọc bỏ các giá trị null nếu có
        const filteredCategories = topCategories.filter(cat => cat !== null);

        res.status(200).json({
            categories: filteredCategories
        });
    } catch (error) {
        console.error('Error fetching top categories:', error);
        res.status(400).json({
            code: 400,
            message: error.message
        });
    }
};

/**
 * Lấy 10 sản phẩm theo trạng thái (all, popular, on sale, best rated)
 */
module.exports.getProductsByStatus = async (req, res) => {
    try {
        const { status = 'all' } = req.query;
        const limit = 10;
        let products = [];

        switch(status.toLowerCase()) {
            case 'on sale':
            case 'onsale': 
                // Lấy 10 sản phẩm đang sale với discount cao nhất
                products = await Product.find({ onSale: true })
                    .sort({ discountPercentage: -1 })
                    .limit(limit);
                break;

            case 'popular':
                // Lấy 10 sản phẩm có rating cao nhất
                products = await Product.find()
                    .sort({ rating: -1 })
                    .limit(limit);
                break;

            case 'best rated':
            case 'bestrated':
                // Lấy 10 sản phẩm có rating cao nhất và có ít nhất 1 review
                products = await Product.find({ 'reviews.0': { $exists: true } })
                    .sort({ rating: -1 })
                    .limit(limit);
                
                // Nếu không có đủ sản phẩm có reviews, lấy thêm các sản phẩm có rating cao
                if (products.length < limit) {
                    const additionalProducts = await Product.find({ 
                        _id: { $nin: products.map(p => p._id) } 
                    })
                    .sort({ rating: -1 })
                    .limit(limit - products.length);
                    
                    products = [...products, ...additionalProducts];
                }
                break;

            case 'all':
            default:
                // Lấy 10 sản phẩm ngẫu nhiên
                const count = await Product.countDocuments();
                const random = Math.floor(Math.random() * Math.max(0, count - limit));
                products = await Product.find()
                    .skip(random)
                    .limit(limit);
                break;
        }

        res.status(200).json({
            status: status,
            products: products
        });
    } catch (error) {
        console.error('Error fetching products by status:', error);
        res.status(400).json({
            code: 400,
            message: error.message
        });
    }
};



