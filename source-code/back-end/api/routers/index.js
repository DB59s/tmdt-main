const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');

const productRouter = require('./customer/Product/product.router');
const ordersRouter = require('./customer/Order/orders.router');
const categoryRouter = require('./customer/Category/category.router');
const reviewRouter = require('./customer/Review/review.router');
const userRouter = require('./User/User');
const LoginRouter = require('./User/login.router');
const discountRouter = require('./customer/Discount/index');
const productAdminRouter = require('./admin/Product/product.admin.router');
const ordersAdminRouter = require('./admin/Order/orders.admin.router');
const discountAdminRouter = require('./admin/Discount/discount');
const refundRequestAdminRouter = require('./admin/RefundRequest/index');
const returnRequestAdminRouter = require('./admin/ReturnRequest/returnRequest.admin.router');
const uploadRouter = require('./upload.router');
const statisticsAdminRouter = require('./admin/Statistic/statistics.admin.router');
const reviewAdminRouter = require('./admin/Review/review.admin.router');
const settingsAdminRouter = require('./admin/Setting/settings.admin.router');
const categoryAdminRouter = require('./admin/Category/category.admin.router');

// New customer routes for device identification, profile, and cart
const deviceRouter = require('./customer/Device');
const profileRouter = require('./customer/Profile');
const cartRouter = require('./customer/Cart');
const wishlistRouter = require('./customer/Wishlist/wishlist.router');
const returnRequestRouter = require('./customer/ReturnRequest/returnRequest.router');
const paymentRouter = require('./customer/payment.router');

module.exports = (app) => {
    // Thiết lập thư mục uploads là thư mục tĩnh để truy cập các file đã upload
    app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
    
    app.use('/api/user', userRouter);
    app.use('/api' , LoginRouter);
    app.use('/api/admin/products', productAdminRouter);
    app.use('/api/admin/orders', ordersAdminRouter);
    app.use('/api/admin/discounts', discountAdminRouter);
    app.use('/api/admin/refund-requests', refundRequestAdminRouter);
    app.use('/api/admin/return-requests', returnRequestAdminRouter);
    app.use('/api/admin/statistics', statisticsAdminRouter);
    app.use('/api/admin/reviews', reviewAdminRouter);
    app.use('/api/admin/settings', settingsAdminRouter);
    app.use('/api/admin/categories', categoryAdminRouter);
    
    // API upload file
    app.use('/api/upload', uploadRouter);
    
    // New customer routes for device identification, profile, cart, and wishlist
    app.use('/api/customer/device', deviceRouter);
    app.use('/api/customer/profile', profileRouter);
    app.use('/api/customer/cart', cartRouter);
    app.use('/api/customer/wishlist', wishlistRouter);
    app.use('/api/customer/return-requests', returnRequestRouter);
    app.use('/api/customer/products', productRouter);
    app.use('/api/customer/orders', ordersRouter);
    app.use('/api/customer/categories', categoryRouter);
    app.use('/api/customer/reviews', reviewRouter);
    app.use('/api/customer/discount', discountRouter);
    app.use('/api/customer/payment', paymentRouter);
}

