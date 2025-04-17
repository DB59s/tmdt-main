/**
 * Script để chuyển đổi giá sản phẩm từ USD sang VND
 * 
 * Cách sử dụng:
 * 1. Đặt file này trong thư mục gốc của project back-end
 * 2. Chỉnh sửa tỷ giá USD_TO_VND nếu cần
 * 3. Chạy lệnh: node convert-prices-to-vnd.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development' });
const Product = require('./api/models/products.model');

// Cấu hình tỷ giá USD sang VND
const USD_TO_VND = 24500; // Tỷ giá 1 USD = 24,500 VND

// Kết nối đến database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Đã kết nối đến MongoDB');
  } catch (error) {
    console.error('Lỗi kết nối MongoDB:', error.message);
    process.exit(1);
  }
};

// Chuyển đổi giá từ USD sang VND
const convertPricesToVND = async () => {
  try {
    // Lấy tất cả sản phẩm
    const products = await Product.find({});
    console.log(`Tìm thấy ${products.length} sản phẩm để chuyển đổi giá`);

    let updatedCount = 0;
    
    // Duyệt qua từng sản phẩm và cập nhật giá
    for (const product of products) {
      // Giữ lại giá USD gốc (thêm trường mới)
      const priceUSD = product.price;
      const priceBeforeSaleUSD = product.priceBeforeSale;
      
      // Chuyển đổi sang VND
      const priceVND = Math.round(priceUSD * USD_TO_VND);
      const priceBeforeSaleVND = Math.round(priceBeforeSaleUSD * USD_TO_VND);
      
      // Cập nhật sản phẩm
      product.priceUSD = priceUSD; // Lưu giá USD gốc
      product.priceBeforeSaleUSD = priceBeforeSaleUSD; // Lưu giá USD gốc trước sale
      product.price = priceVND; // Cập nhật giá sang VND
      product.priceBeforeSale = priceBeforeSaleVND; // Cập nhật giá trước sale sang VND
      
      await product.save();
      updatedCount++;
      
      console.log(`Đã cập nhật sản phẩm: ${product.title}`);
      console.log(`  - Giá USD: $${priceUSD} -> Giá VND: ${priceVND.toLocaleString('vi-VN')} ₫`);
      console.log(`  - Giá gốc USD: $${priceBeforeSaleUSD} -> Giá gốc VND: ${priceBeforeSaleVND.toLocaleString('vi-VN')} ₫`);
    }
    
    console.log(`Đã hoàn thành chuyển đổi giá cho ${updatedCount}/${products.length} sản phẩm`);
  } catch (error) {
    console.error('Lỗi khi chuyển đổi giá:', error);
  } finally {
    // Đóng kết nối MongoDB
    mongoose.connection.close();
    console.log('Đã đóng kết nối MongoDB');
  }
};

// Thực thi script
(async () => {
  await connectDB();
  await convertPricesToVND();
})(); 