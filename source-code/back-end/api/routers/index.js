const express = require('express');
const router = express.Router();

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

// New customer routes for device identification, profile, and cart
const deviceRouter = require('./customer/Device');
const profileRouter = require('./customer/Profile');
const cartRouter = require('./customer/Cart');

module.exports = (app) => {
    app.use('/api/user', userRouter);
    app.use('/api' , LoginRouter);
    app.use('/api/admin/products', productAdminRouter);
    app.use('/api/admin/orders', ordersAdminRouter);
    app.use('/api/admin/discounts', discountAdminRouter);
    app.use('/api/admin/refund-requests', refundRequestAdminRouter);
    
    // New customer routes for device identification, profile, and cart
    app.use('/api/customer/device', deviceRouter);
    app.use('/api/customer/profile', profileRouter);
    app.use('/api/customer/cart', cartRouter);
    app.use('/api/customer/products', productRouter);
    app.use('/api/customer/orders', ordersRouter);
    app.use('/api/customer/categories', categoryRouter);
    app.use('/api/customer/reviews', reviewRouter);
    app.use('/api/customer/discount', discountRouter);
}

