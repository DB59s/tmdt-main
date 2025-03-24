const axios = require('axios');
const mongoose = require('mongoose');
const Product = require('./api/models/products.model'); // Đường dẫn đến model
const Category = require('./api/models/category.model'); // Đường dẫn đến model category
require('dotenv').config(); // Để sử dụng biến môi trường từ file .env

// Kết nối đến MongoDB
mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Hàm cào dữ liệu
async function crawlProducts() {
    try {
        const response = await axios.get('https://dummyjson.com/products?limit=150');
        const products = response.data.products;

        // Lưu từng sản phẩm vào cơ sở dữ liệu
        for (const product of products) {
            console.log('Crawling product:', product); // Log sản phẩm để kiểm tra

            // Kiểm tra và thêm danh mục vào bảng category
            let category = await Category.findOne({ name: product.category });
            if (!category) {
                category = new Category({ name: product.category });
                await category.save();
            }

            const newProduct = new Product({
                title: product.title,
                description: product.description,
                categoryId: category._id, // Liên kết với category
                price: product.price,
                discountPercentage: product.discountPercentage,
                rating: product.rating,
                stock: product.stock,
                tags: product.tags,
                brand: product.brand || 'Unknown', // Gán giá trị mặc định nếu không có
                sku: product.sku,
                weight: product.weight,
                dimensions: {
                    width: product.dimensions.width,
                    height: product.dimensions.height,
                    depth: product.dimensions.depth
                },
                warrantyInformation: product.warrantyInformation,
                shippingInformation: product.shippingInformation,
                availabilityStatus: product.availabilityStatus,
                returnPolicy: product.returnPolicy,
                images: product.images,
                thumbnail: product.thumbnail
            });

            await newProduct.save();
        }

        console.log('Products crawled and saved successfully!');
    } catch (error) {
        console.error('Error crawling products:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Gọi hàm cào dữ liệu
crawlProducts();
