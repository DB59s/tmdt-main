const Product = require('../../models/products.model');

// Tính toán giá ban đầu từ discountPercentage
module.exports.calculatePriceBeforeSale = async (req, res) => {
    try {
        const { price, discountPercentage } = req.body;
        
        if (!price || !discountPercentage) {
            return res.status(400).json({
                message: 'Cần cung cấp cả giá hiện tại và phần trăm giảm giá'
            });
        }

        // Tính toán giá trước khi giảm giá
        // Công thức: priceBeforeSale = price / (1 - (discountPercentage / 100))
        const priceBeforeSale = price / (1 - (discountPercentage / 100));
        
        res.status(200).json({
            priceBeforeSale: Math.round(priceBeforeSale * 100) / 100,
            price,
            discountPercentage
        });
    } catch (error) {
        console.error('Error calculating price before sale:', error);
        res.status(500).json({
            message: 'Đã xảy ra lỗi khi tính toán giá ban đầu',
            error: error.message
        });
    }
};

// Thêm sản phẩm mới
module.exports.createProduct = async (req, res) => {
    console.log(req.body);
    try {
        const {
            title,
            description,
            categoryId,
            price,
            priceBeforeSale,
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
            thumbnail,
            onSale = false
        } = req.body;

        // Kiểm tra xem SKU đã tồn tại chưa
        const existingSku = await Product.findOne({ sku });
        if (existingSku) {
            return res.status(400).json({
                message: 'SKU đã tồn tại'
            });
        }

        // Tính toán priceBeforeSale nếu không được cung cấp
        let calculatedPriceBeforeSale = priceBeforeSale;
        if (!calculatedPriceBeforeSale && discountPercentage > 0) {
            calculatedPriceBeforeSale = price / (1 - (discountPercentage / 100));
            calculatedPriceBeforeSale = Math.round(calculatedPriceBeforeSale * 100) / 100;
        } else if (!calculatedPriceBeforeSale) {
            calculatedPriceBeforeSale = price;
        }

        // Xử lý trường dimensions nếu là chuỗi
        let parsedDimensions = dimensions;
        if (typeof dimensions === 'string') {
            // Tách chuỗi theo dấu 'x' và chuyển đổi thành số
            const dimensionParts = dimensions.split('x').map(part => parseFloat(part.trim()));
            
            // Kiểm tra nếu đủ 3 phần: width, height, depth
            if (dimensionParts.length === 3) {
                parsedDimensions = {
                    width: dimensionParts[0],
                    height: dimensionParts[1],
                    depth: dimensionParts[2]
                };
            } else {
                return res.status(400).json({
                    message: 'Định dạng dimensions không hợp lệ. Vui lòng sử dụng format "width x height x depth"'
                });
            }
        }

        // Kiểm tra brand có hợp lệ không
        if (!brand || brand.trim() === '') {
            return res.status(400).json({
                message: 'Thương hiệu (brand) là bắt buộc'
            });
        }

        const product = new Product({
            title,
            description,
            categoryId,
            price,
            priceBeforeSale: calculatedPriceBeforeSale,
            discountPercentage,
            rating,
            stock,
            tags,
            brand,
            sku,
            weight,
            dimensions: parsedDimensions,
            warrantyInformation,
            shippingInformation,
            availabilityStatus,
            returnPolicy,
            images,
            thumbnail,
            onSale: discountPercentage > 0 ? true : onSale
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

// Cập nhật thông tin sản phẩm
module.exports.updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const updateData = req.body;
        
        // Xử lý dimensions nếu là chuỗi
        if (updateData.dimensions && typeof updateData.dimensions === 'string') {
            // Tách chuỗi theo dấu 'x' và chuyển đổi thành số
            const dimensionParts = updateData.dimensions.split('x').map(part => parseFloat(part.trim()));
            
            // Kiểm tra nếu đủ 3 phần: width, height, depth
            if (dimensionParts.length === 3) {
                updateData.dimensions = {
                    width: dimensionParts[0],
                    height: dimensionParts[1],
                    depth: dimensionParts[2]
                };
            } else {
                return res.status(400).json({
                    message: 'Định dạng dimensions không hợp lệ. Vui lòng sử dụng format "width x height x depth"'
                });
            }
        }
        
        // Tính lại priceBeforeSale nếu cần
        if (updateData.price && updateData.discountPercentage && !updateData.priceBeforeSale) {
            updateData.priceBeforeSale = updateData.price / (1 - (updateData.discountPercentage / 100));
            updateData.priceBeforeSale = Math.round(updateData.priceBeforeSale * 100) / 100;
        }
        
        // Cập nhật onSale dựa trên discountPercentage nếu có
        if (updateData.discountPercentage > 0) {
            updateData.onSale = true;
        }
        
        // Kiểm tra brand có hợp lệ không nếu được cập nhật
        if (updateData.brand !== undefined && (!updateData.brand || updateData.brand.trim() === '')) {
            return res.status(400).json({
                message: 'Thương hiệu (brand) là bắt buộc'
            });
        }
        
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { $set: updateData },
            { new: true, runValidators: true }
        );
        
        if (!updatedProduct) {
            return res.status(404).json({
                message: 'Không tìm thấy sản phẩm'
            });
        }
        
        res.status(200).json({
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

// Tính toán giá ban đầu từ discountPercentage cho tất cả sản phẩm
module.exports.calculateAllProductsPriceBeforeSale = async (req, res) => {
    try {
        // Lấy tất cả sản phẩm
        const products = await Product.find({});
        
        const updatedProducts = [];
        let errorProducts = [];

        // Tính toán lại priceBeforeSale cho từng sản phẩm
        for (const product of products) {
            try {
                // Tính toán priceBeforeSale dựa trên giá hiện tại và phần trăm giảm giá
                if (product.discountPercentage > 0) {
                    product.priceBeforeSale = product.price / (1 - (product.discountPercentage / 100));
                    product.priceBeforeSale = Math.round(product.priceBeforeSale * 100) / 100;
                    product.onSale = true;
                } else {
                    product.priceBeforeSale = product.price;
                    product.onSale = false;
                }
                
                // Lưu sản phẩm đã cập nhật
                await product.save();
                updatedProducts.push({
                    id: product._id,
                    title: product.title,
                    price: product.price,
                    discountPercentage: product.discountPercentage,
                    priceBeforeSale: product.priceBeforeSale,
                    onSale: product.onSale
                });
            } catch (error) {
                errorProducts.push({
                    id: product._id,
                    title: product.title,
                    error: error.message
                });
            }
        }

        res.status(200).json({
            message: `Đã cập nhật giá ban đầu cho ${updatedProducts.length} sản phẩm`,
            updated: updatedProducts.length,
            total: products.length,
            errors: errorProducts.length,
            errorProducts: errorProducts.length > 0 ? errorProducts : undefined
        });
    } catch (error) {
        console.error('Error calculating all products price before sale:', error);
        res.status(500).json({
            message: 'Đã xảy ra lỗi khi tính toán giá ban đầu cho tất cả sản phẩm',
            error: error.message
        });
    }
};

/**
 * Đặt trạng thái onSale cho tất cả sản phẩm thuộc một danh mục
 * và đặt các sản phẩm còn lại thành false
 */
module.exports.setOnSaleByCategoryId = async (req, res) => {
    try {
        const { categoryId } = req.body;
        
        if (!categoryId) {
            return res.status(400).json({
                message: 'Thiếu mã danh mục (categoryId)'
            });
        }
        
        
        // 1. Cập nhật tất cả sản phẩm thành NOT onSale
        await Product.updateMany(
            {}, 
            { 
                onSale: false 
            }
        );
        
        // 2. Tìm tất cả sản phẩm trong danh mục
        const productsInCategory = await Product.find({ categoryId });
        
        if (productsInCategory.length === 0) {
            return res.status(404).json({
                message: 'Không tìm thấy sản phẩm nào trong danh mục này'
            });
        }
        
        // 3. Cập nhật từng sản phẩm thuộc danh mục thành onSale = true và tính toán giá
        const updatedProducts = [];
        
        for (const product of productsInCategory) {
            // const priceBeforeSale = product.price / (1 - (discountPercentage / 100));
            // const roundedPriceBeforeSale = Math.round(priceBeforeSale * 100) / 100;
            
            await Product.updateOne(
                { _id: product._id },
                {
                    onSale: true,
                }
            );
            
            updatedProducts.push({
                id: product._id,
                title: product.title
            });
        }
        
        res.status(200).json({
            message: `Đã cập nhật ${updatedProducts.length} sản phẩm thuộc danh mục thành đang sale và đặt các sản phẩm còn lại thành không sale`,
            productsUpdated: updatedProducts.length,
            categoryId,
        });
        
    } catch (error) {
        console.error('Error setting products on sale by category:', error);
        res.status(500).json({
            message: 'Đã xảy ra lỗi khi cập nhật trạng thái sale cho sản phẩm',
            error: error.message
        });
    }
};

