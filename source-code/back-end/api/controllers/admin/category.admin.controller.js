const Category = require('../../models/category.model');
const Product = require('../../models/products.model');
const mongoose = require('mongoose');

/**
 * Lấy danh sách tất cả danh mục
 */
exports.getAllCategories = async (req, res) => {
    try {
        // Có thể bổ sung tham số tìm kiếm, sắp xếp nếu cần
        const { sort = 'name', order = 'asc', search = '' } = req.query;
        
        // Xây dựng điều kiện tìm kiếm
        const filter = {};
        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }
        
        // Xây dựng điều kiện sắp xếp
        const sortOption = {};
        sortOption[sort] = order === 'asc' ? 1 : -1;
        
        const categories = await Category.find(filter)
            .sort(sortOption);
        
        const categoriesWithProductCount = await Promise.all(
            categories.map(async (category) => {
                const productCount = await Product.countDocuments({ categoryId: category._id });
                return {
                    ...category.toObject(),
                    productCount
                };
            })
        );
        
        res.status(200).json({
            success: true,
            data: {
                categories: categoriesWithProductCount,
                total: categoriesWithProductCount.length
            }
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách danh mục',
            error: error.message
        });
    }
};

/**
 * Lấy thông tin một danh mục theo ID
 */
exports.getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Kiểm tra ID hợp lệ
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID danh mục không hợp lệ'
            });
        }
        
        const category = await Category.findById(id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục'
            });
        }
        
        // Đếm số lượng sản phẩm thuộc danh mục
        const productCount = await Product.countDocuments({ categoryId: category._id });
        
        res.status(200).json({
            success: true,
            data: {
                category: {
                    ...category.toObject(),
                    productCount
                }
            }
        });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin danh mục',
            error: error.message
        });
    }
};

/**
 * Tạo danh mục mới
 */
exports.createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        
        // Kiểm tra tên danh mục đã nhập
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Tên danh mục không được để trống'
            });
        }
        
        // Kiểm tra danh mục đã tồn tại chưa
        const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Danh mục này đã tồn tại'
            });
        }
        
        // Tạo danh mục mới
        const newCategory = new Category({
            name
        });
        
        await newCategory.save();
        
        res.status(201).json({
            success: true,
            message: 'Thêm danh mục thành công',
            data: { category: newCategory }
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo danh mục mới',
            error: error.message
        });
    }
};

/**
 * Cập nhật thông tin danh mục
 */
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        
        // Kiểm tra ID hợp lệ
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID danh mục không hợp lệ'
            });
        }
        
        // Kiểm tra tên danh mục đã nhập
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Tên danh mục không được để trống'
            });
        }
        
        // Kiểm tra danh mục cần cập nhật có tồn tại không
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục'
            });
        }
        
        // Kiểm tra tên mới đã tồn tại chưa (ngoại trừ danh mục hiện tại)
        const existingCategory = await Category.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            _id: { $ne: id }
        });
        
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Tên danh mục này đã tồn tại'
            });
        }
        
        // Cập nhật danh mục
        category.name = name;
        await category.save();
        
        res.status(200).json({
            success: true,
            message: 'Cập nhật danh mục thành công',
            data: { category }
        });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật danh mục',
            error: error.message
        });
    }
};

/**
 * Xóa danh mục
 */
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Kiểm tra ID hợp lệ
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID danh mục không hợp lệ'
            });
        }
        
        // Kiểm tra danh mục cần xóa có tồn tại không
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục'
            });
        }
        
        // Kiểm tra xem có sản phẩm nào thuộc danh mục này không
        const productsInCategory = await Product.countDocuments({ categoryId: id });
        if (productsInCategory > 0) {
            return res.status(400).json({
                success: false,
                message: `Không thể xóa danh mục này vì có ${productsInCategory} sản phẩm đang sử dụng`
            });
        }
        
        // Thực hiện xóa danh mục
        await Category.findByIdAndDelete(id);
        
        res.status(200).json({
            success: true,
            message: 'Xóa danh mục thành công'
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa danh mục',
            error: error.message
        });
    }
};

/**
 * Lấy danh sách sản phẩm theo danh mục
 */
exports.getProductsByCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;
        
        // Kiểm tra ID hợp lệ
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID danh mục không hợp lệ'
            });
        }
        
        // Kiểm tra danh mục có tồn tại không
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục'
            });
        }
        
        // Xây dựng điều kiện sắp xếp
        const sortOption = {};
        sortOption[sort] = order === 'asc' ? 1 : -1;
        
        // Lấy danh sách sản phẩm theo danh mục với phân trang
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const products = await Product.find({ categoryId: id })
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit));
        
        const totalProducts = await Product.countDocuments({ categoryId: id });
        
        res.status(200).json({
            success: true,
            data: {
                products,
                pagination: {
                    total: totalProducts,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(totalProducts / parseInt(limit))
                },
                category
            }
        });
    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách sản phẩm theo danh mục',
            error: error.message
        });
    }
}; 