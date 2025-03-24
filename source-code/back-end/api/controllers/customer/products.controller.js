const Product = require('../../models/products.model');

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



