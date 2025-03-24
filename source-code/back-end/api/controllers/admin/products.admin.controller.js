const Product = require('../../models/products.model');

// Thêm sản phẩm mới
module.exports.createProduct = async (req, res) => {
    try {
        const {
            title,
            description,
            categoryId,
            price,
            discountPercentage,
            rating,
            stock,
            tags,
            brand,
            sku,
            weight,
            dimensions,
            warrantyInformation,
            shippingInformation,
            availabilityStatus,
            returnPolicy,
            images,
            thumbnail
        } = req.body;

        // Kiểm tra xem SKU đã tồn tại chưa
        const existingSku = await Product.findOne({ sku });
        if (existingSku) {
            return res.status(400).json({
                message: 'SKU đã tồn tại'
            });
        }

        const product = new Product({
            title,
            description,
            categoryId,
            price,
            discountPercentage,
            rating,
            stock,
            tags,
            brand,
            sku,
            weight,
            dimensions,
            warrantyInformation,
            shippingInformation,
            availabilityStatus,
            returnPolicy,
            images,
            thumbnail
        });

        await product.save();
        res.status(201).json({
            message: 'Thêm sản phẩm thành công',
            product
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            message: 'Đã xảy ra lỗi khi thêm sản phẩm',
            error: error.message
        });
    }
};

// Cập nhật sản phẩm
module.exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Kiểm tra xem sản phẩm có tồn tại không
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                message: 'Không tìm thấy sản phẩm'
            });
        }

        // Nếu có cập nhật SKU, kiểm tra xem SKU mới đã tồn tại chưa
        if (updateData.sku && updateData.sku !== product.sku) {
            const existingSku = await Product.findOne({ sku: updateData.sku });
            if (existingSku) {
                return res.status(400).json({
                    message: 'SKU đã tồn tại'
                });
            }
        }

        // Cập nhật sản phẩm
        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.json({
            message: 'Cập nhật sản phẩm thành công',
            product: updatedProduct
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            message: 'Đã xảy ra lỗi khi cập nhật sản phẩm',
            error: error.message
        });
    }
};

// Xóa sản phẩm
module.exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        console.log(id);

        // Kiểm tra xem sản phẩm có tồn tại không
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                message: 'Không tìm thấy sản phẩm'
            });
        }

        // Xóa sản phẩm
        await Product.findByIdAndDelete(id);

        res.json({
            message: 'Xóa sản phẩm thành công',
            productId: id
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            message: 'Đã xảy ra lỗi khi xóa sản phẩm',
            error: error.message
        });
    }
};

