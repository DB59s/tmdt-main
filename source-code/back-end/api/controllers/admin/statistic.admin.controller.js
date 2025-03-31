const Order = require('../../models/order.model');
const OrderItem = require('../../models/orderItem.model');
const User = require('../../models/User.model');
const Product = require('../../models/products.model');
const ReturnRequest = require('../../models/returnRequest.model');
const Cart = require('../../models/cart.model');
const Wishlist = require('../../models/wishlist.model');
const Customer = require('../../models/customer.model');
const mongoose = require('mongoose');

/**
 * Lấy tổng quan doanh số, đơn hàng, số lượng khách hàng và sản phẩm
 */
exports.getOverview = async (req, res) => {
    try {
        // Tính tổng doanh thu
        const revenueResult = await Order.aggregate([
            { $match: { status: 'Đã giao hàng' } },
            { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
        ]);
        
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
        
        // Đếm tổng số đơn hàng
        const totalOrders = await Order.countDocuments();
        
        // Đếm tổng số sản phẩm
        const totalProducts = await Product.countDocuments();
        
        // Đếm tổng số khách hàng
        const totalCustomers = await User.countDocuments({ role_id: { $ne: '1' }, deleted: false });
        
        // Lấy 5 đơn hàng gần nhất
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5);
            
        // Lấy top 5 sản phẩm bán chạy nhất
        const topSellingProducts = await OrderItem.aggregate([
            {
                $group: {
                    _id: '$productId',
                    totalSold: { $sum: '$quantity' },
                    totalRevenue: { $sum: { $multiply: ['$price', '$quantity'] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            {
                $project: {
                    _id: 1,
                    totalSold: 1,
                    totalRevenue: 1,
                    product: { $arrayElemAt: ['$product', 0] }
                }
            }
        ]);
        
        res.status(200).json({
            success: true,
            data: {
                totalRevenue,
                totalOrders,
                totalProducts,
                totalCustomers,
                recentOrders,
                topSellingProducts
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard overview:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy tổng quan dashboard',
            error: error.message
        });
    }
};

/**
 * Thống kê doanh thu theo thời gian
 */
exports.getRevenueStatistics = async (req, res) => {
    try {
        const { period = 'month', fromDate, toDate } = req.query;
        
        // Xây dựng điều kiện lọc theo khoảng thời gian
        const dateFilter = { status: 'Đã giao hàng' };
        
        if (fromDate && toDate) {
            dateFilter.createdAt = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate)
            };
        }
        
        // Định dạng dữ liệu theo khoảng thời gian
        let groupFormat;
        let sortFormat;
        
        if (period === 'day') {
            groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
            sortFormat = { _id: 1 };
        } else if (period === 'week') {
            groupFormat = { 
                year: { $year: '$createdAt' },
                week: { $week: '$createdAt' }
            };
            sortFormat = { 'year': 1, 'week': 1 };
        } else if (period === 'month') {
            groupFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
            sortFormat = { _id: 1 };
        } else if (period === 'year') {
            groupFormat = { $dateToString: { format: '%Y', date: '$createdAt' } };
            sortFormat = { _id: 1 };
        }
        
        const revenueData = await Order.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: groupFormat,
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: sortFormat }
        ]);
        
        // Format lại dữ liệu nếu là thống kê theo tuần
        if (period === 'week') {
            const weeklyData = revenueData.map(item => ({
                date: `${item._id.year}-W${item._id.week}`,
                revenue: item.revenue,
                orders: item.orders
            }));
            
            return res.status(200).json({
                success: true,
                data: { revenueData: weeklyData }
            });
        }
        
        res.status(200).json({
            success: true,
            data: { revenueData }
        });
    } catch (error) {
        console.error('Error fetching revenue statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê doanh thu',
            error: error.message
        });
    }
};

/**
 * Thống kê sản phẩm bán chạy
 */
exports.getTopProducts = async (req, res) => {
    try {
        const { limit = 10, fromDate, toDate, categoryId } = req.query;
        
        // Xây dựng điều kiện lọc theo khoảng thời gian
        const dateFilter = {};
        
        if (fromDate && toDate) {
            dateFilter.createdAt = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate)
            };
        }
        
        // Pipeline cho việc tính toán sản phẩm bán chạy
        const pipeline = [
            { $match: dateFilter },
            {
                $lookup: {
                    from: 'orderitems',
                    localField: '_id',
                    foreignField: 'orderId',
                    as: 'items'
                }
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.productId',
                    totalSold: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: parseInt(limit) },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            {
                $project: {
                    _id: 1,
                    totalSold: 1,
                    totalRevenue: 1,
                    product: { $arrayElemAt: ['$product', 0] }
                }
            }
        ];
        
        // Thêm lọc theo danh mục nếu có
        if (categoryId) {
            pipeline.push({
                $match: {
                    'product.categoryId': mongoose.Types.ObjectId.isValid(categoryId) 
                        ? new mongoose.Types.ObjectId(categoryId) 
                        : categoryId
                }
            });
        }
        
        const topProducts = await Order.aggregate(pipeline);
        
        // Thêm thông tin đánh giá sản phẩm
        const productsWithRating = await Promise.all(topProducts.map(async (item) => {
            const avgRating = item.product ? item.product.rating : 0;
            return {
                ...item,
                avgRating
            };
        }));
        
        res.status(200).json({
            success: true,
            data: { 
                topProducts: productsWithRating,
                total: productsWithRating.length
            }
        });
    } catch (error) {
        console.error('Error fetching top products:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê sản phẩm bán chạy',
            error: error.message
        });
    }
};

/**
 * Thống kê tỷ lệ đơn hàng bị đổi/trả
 */
exports.getReturnRate = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        
        // Xây dựng điều kiện lọc theo khoảng thời gian
        const dateFilter = {};
        
        if (fromDate && toDate) {
            dateFilter.createdAt = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate)
            };
        }
        
        // Đếm tổng số đơn hàng
        const totalOrders = await Order.countDocuments(dateFilter);
        
        // Đếm tổng số yêu cầu đổi/trả hàng
        const totalReturns = await ReturnRequest.countDocuments(dateFilter);
        
        // Tính tỷ lệ đổi/trả
        const returnRate = totalOrders > 0 ? (totalReturns / totalOrders) * 100 : 0;
        
        // Thống kê theo lý do
        const returnsByReason = await ReturnRequest.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$reason',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    reason: '$_id',
                    count: 1,
                    percentage: { 
                        $multiply: [
                            { $divide: ['$count', totalReturns > 0 ? totalReturns : 1] },
                            100
                        ] 
                    },
                    _id: 0
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        // Thống kê theo loại yêu cầu (đổi/trả)
        const returnsByType = await ReturnRequest.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$requestType',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    type: '$_id',
                    count: 1,
                    percentage: { 
                        $multiply: [
                            { $divide: ['$count', totalReturns > 0 ? totalReturns : 1] },
                            100
                        ] 
                    },
                    _id: 0
                }
            }
        ]);
        
        // Thống kê theo sản phẩm
        const returnsByProduct = await ReturnRequest.aggregate([
            { $match: dateFilter },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.productId',
                    count: { $sum: '$items.quantity' }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            {
                $project: {
                    productId: '$_id',
                    product: { $arrayElemAt: ['$product', 0] },
                    count: 1,
                    _id: 0
                }
            }
        ]);
        
        res.status(200).json({
            success: true,
            data: {
                totalOrders,
                totalReturns,
                returnRate: Number(returnRate.toFixed(2)),
                returnsByReason,
                returnsByType,
                returnsByProduct
            }
        });
    } catch (error) {
        console.error('Error fetching return rate statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê tỷ lệ đơn hàng bị đổi/trả',
            error: error.message
        });
    }
};

/**
 * Phân tích hành vi người dùng
 */
exports.getUserBehaviorAnalysis = async (req, res) => {
    try {
        const { fromDate, toDate, limit = 10 } = req.query;
        
        // Xây dựng điều kiện lọc theo khoảng thời gian
        const dateFilter = {};
        
        if (fromDate && toDate) {
            dateFilter.createdAt = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate)
            };
        }
        
        // 1. Phân tích sản phẩm được thêm vào giỏ hàng nhiều nhất
        const topCartItems = await Cart.aggregate([
            { $match: dateFilter },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.productId',
                    addedToCartCount: { $sum: 1 },
                    totalQuantity: { $sum: '$items.quantity' }
                }
            },
            { $sort: { addedToCartCount: -1 } },
            { $limit: parseInt(limit) },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            {
                $project: {
                    productId: '$_id',
                    addedToCartCount: 1,
                    totalQuantity: 1,
                    product: { $arrayElemAt: ['$product', 0] },
                    _id: 0
                }
            }
        ]);
        
        // 2. Phân tích sản phẩm được thêm vào wishlist nhiều nhất
        const topWishlistItems = await Wishlist.aggregate([
            { $match: dateFilter },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.productId',
                    addedToWishlistCount: { $sum: 1 }
                }
            },
            { $sort: { addedToWishlistCount: -1 } },
            { $limit: parseInt(limit) },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            {
                $project: {
                    productId: '$_id',
                    addedToWishlistCount: 1,
                    product: { $arrayElemAt: ['$product', 0] },
                    _id: 0
                }
            }
        ]);
        
        // 3. Tỷ lệ giỏ hàng bị bỏ quên
        const activeCartsCount = await Cart.countDocuments({ 
            ...dateFilter, 
            status: 'active' 
        });
        
        const abandonedCartsCount = await Cart.countDocuments({ 
            ...dateFilter, 
            status: 'abandoned' 
        });
        
        const convertedCartsCount = await Cart.countDocuments({ 
            ...dateFilter, 
            status: 'converted' 
        });
        
        const totalCartsCount = activeCartsCount + abandonedCartsCount + convertedCartsCount;
        
        const abandonedCartRate = totalCartsCount > 0 
            ? (abandonedCartsCount / totalCartsCount) * 100 
            : 0;
        
        const conversionRate = totalCartsCount > 0 
            ? (convertedCartsCount / totalCartsCount) * 100 
            : 0;
        
        // 4. Thời gian trung bình để hoàn thành đơn hàng
        const orderCompletionTime = await Order.aggregate([
            { 
                $match: { 
                    ...dateFilter,
                    status: 'Đã giao hàng'
                } 
            },
            {
                $project: {
                    completionTime: { 
                        $subtract: ['$updatedAt', '$createdAt'] 
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    averageTime: { $avg: '$completionTime' }
                }
            }
        ]);
        
        // Convert time from milliseconds to days
        const avgCompletionTimeInDays = orderCompletionTime.length > 0 
            ? orderCompletionTime[0].averageTime / (1000 * 60 * 60 * 24) 
            : 0;
        
        // 5. Tính toán tỷ lệ người dùng trở lại (đặt nhiều đơn hàng)
        const repeatCustomerData = await Order.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$customerId',
                    orderCount: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: null,
                    totalCustomers: { $sum: 1 },
                    repeatCustomers: { 
                        $sum: { 
                            $cond: [{ $gt: ['$orderCount', 1] }, 1, 0] 
                        } 
                    }
                }
            }
        ]);
        
        const { totalCustomers = 0, repeatCustomers = 0 } = 
            repeatCustomerData.length > 0 ? repeatCustomerData[0] : {};
        
        const repeatCustomerRate = totalCustomers > 0 
            ? (repeatCustomers / totalCustomers) * 100 
            : 0;
        
        res.status(200).json({
            success: true,
            data: {
                cartAnalysis: {
                    activeCartsCount,
                    abandonedCartsCount,
                    convertedCartsCount,
                    abandonedCartRate: Number(abandonedCartRate.toFixed(2)),
                    conversionRate: Number(conversionRate.toFixed(2)),
                    topCartedProducts: topCartItems
                },
                wishlistAnalysis: {
                    topWishlistedProducts: topWishlistItems
                },
                orderAnalysis: {
                    avgCompletionTimeInDays: Number(avgCompletionTimeInDays.toFixed(2)),
                    repeatCustomerRate: Number(repeatCustomerRate.toFixed(2)),
                    totalUniqueCustomers: totalCustomers,
                    repeatCustomers
                }
            }
        });
    } catch (error) {
        console.error('Error analyzing user behavior:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi phân tích hành vi người dùng',
            error: error.message
        });
    }
};

/**
 * Thống kê bán hàng theo danh mục
 */
exports.getCategoryStatistics = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        
        // Xây dựng điều kiện lọc theo khoảng thời gian
        const dateFilter = {};
        
        if (fromDate && toDate) {
            dateFilter.createdAt = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate)
            };
        }
        
        // Thống kê doanh số theo danh mục
        const categorySales = await Order.aggregate([
            { $match: { ...dateFilter, status: 'Đã giao hàng' } },
            {
                $lookup: {
                    from: 'orderitems',
                    localField: '_id',
                    foreignField: 'orderId',
                    as: 'items'
                }
            },
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.productId',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $group: {
                    _id: '$product.categoryId',
                    totalSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                    totalQuantity: { $sum: '$items.quantity' },
                    orderCount: { $addToSet: '$_id' }
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            {
                $project: {
                    categoryId: '$_id',
                    category: { $arrayElemAt: ['$category', 0] },
                    totalSales: 1,
                    totalQuantity: 1,
                    orderCount: { $size: '$orderCount' },
                    _id: 0
                }
            },
            { $sort: { totalSales: -1 } }
        ]);
        
        // Tính tổng doanh số để tính tỷ lệ phần trăm
        const totalSales = categorySales.reduce((sum, cat) => sum + cat.totalSales, 0);
        
        // Thêm tỷ lệ phần trăm vào kết quả
        const categoriesWithPercentage = categorySales.map(cat => ({
            ...cat,
            percentage: totalSales > 0 ? Number(((cat.totalSales / totalSales) * 100).toFixed(2)) : 0
        }));
        
        res.status(200).json({
            success: true,
            data: {
                categories: categoriesWithPercentage,
                totalSales
            }
        });
    } catch (error) {
        console.error('Error fetching category statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê theo danh mục',
            error: error.message
        });
    }
};
