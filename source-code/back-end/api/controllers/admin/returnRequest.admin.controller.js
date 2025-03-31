const ReturnRequest = require('../../models/returnRequest.model');
const Order = require('../../models/order.model');
const OrderItem = require('../../models/orderItem.model');
const Product = require('../../models/products.model');
const mongoose = require('mongoose');

/**
 * Lấy danh sách tất cả yêu cầu đổi/trả hàng với phân trang và lọc
 */
exports.getAllReturnRequests = async (req, res) => {
    console.log('getAllReturnRequests');
    console.log(req.query);
    try {
        const { 
            page = 1, 
            limit = 10, 
            status, 
            requestType, 
            sortBy = 'createdAt', 
            sortOrder = 'desc',
            search
        } = req.query;

        // Xây dựng bộ lọc
        const filter = {};
        
        if (status) {
            filter.status = status;
        }
        
        if (requestType) {
            filter.requestType = requestType;
        }
        
        if (search) {
            filter.$or = [
                { customerName: new RegExp(search, 'i') },
                { customerEmail: new RegExp(search, 'i') },
                { customerPhone: new RegExp(search, 'i') }
            ];
        }

        // Thiết lập sắp xếp
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Tính toán phân trang
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Lấy danh sách yêu cầu
        const returnRequests = await ReturnRequest.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('orderId', 'orderId orderDate totalAmount')
            .populate('customerId', 'name email');

        // Đếm tổng số yêu cầu
        const total = await ReturnRequest.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: returnRequests.length,
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            data: returnRequests
        });
    } catch (error) {
        console.error('Error fetching return requests:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách yêu cầu đổi/trả hàng',
            error: error.message
        });
    }
};

/**
 * Lấy thống kê yêu cầu đổi/trả hàng
 */
exports.getReturnStatistics = async (req, res) => {
    try {
        // Xây dựng bộ lọc dựa trên query params
        const filter = {};
        
        // Lọc theo khoảng thời gian
        if (req.query.startDate && req.query.endDate) {
            filter.createdAt = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        } else if (req.query.startDate) {
            filter.createdAt = { $gte: new Date(req.query.startDate) };
        } else if (req.query.endDate) {
            filter.createdAt = { $lte: new Date(req.query.endDate) };
        }
        
        // Đếm tổng số yêu cầu
        const totalRequests = await ReturnRequest.countDocuments(filter);
        
        // Thống kê theo loại yêu cầu
        const typeStats = await ReturnRequest.aggregate([
            { $match: filter },
            { $group: { _id: '$requestType', count: { $sum: 1 } } }
        ]);
        
        // Thống kê theo trạng thái
        const statusStats = await ReturnRequest.aggregate([
            { $match: filter },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        
        // Format kết quả theo yêu cầu của front-end
        const returnTypeCount = typeStats.find(item => item._id === 'refund')?.count || 0;
        const exchangeTypeCount = typeStats.find(item => item._id === 'exchange')?.count || 0;
        
        // Số lượng yêu cầu theo trạng thái
        const pendingRequests = statusStats.find(item => item._id === 'pending')?.count || 0;
        const completedRequests = statusStats.find(item => item._id === 'completed')?.count || 0;
        const rejectedRequests = statusStats.find(item => item._id === 'rejected')?.count || 0;
        
        // Thống kê theo tháng (trong năm hiện tại hoặc năm được chỉ định)
        const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
        const monthlyStats = await ReturnRequest.aggregate([
            {
                $match: {
                    ...filter,
                    createdAt: {
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        // Chuẩn bị dữ liệu thống kê hàng tháng
        const monthlyData = Array(12).fill().map((_, i) => ({
            month: i + 1,
            count: 0
        }));
        
        monthlyStats.forEach(item => {
            const monthIndex = item._id - 1;
            monthlyData[monthIndex].count = item.count;
        });
        
        // Thống kê theo các lý do đổi/trả hàng phổ biến
        const reasonStats = await ReturnRequest.aggregate([
            { $match: filter },
            { $group: { _id: '$reason', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        
        const topReasons = reasonStats.map(item => ({
            reason: item._id,
            count: item.count
        }));
        
        // Cấu trúc phản hồi API theo đúng yêu cầu của front-end
        const responseData = {
            totalRequests,
            pendingRequests,
            completedRequests,
            rejectedRequests,
            returnTypeCount,
            exchangeTypeCount,
            // Thêm dữ liệu chi tiết để mở rộng trong tương lai
            details: {
                monthlyData,
                topReasons,
                statusDistribution: statusStats,
                typeDistribution: typeStats
            }
        };
        
        res.status(200).json({
            success: true,
            message: 'Lấy thống kê yêu cầu đổi/trả hàng thành công',
            data: responseData
        });
    } catch (error) {
        console.error('Error fetching return statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thống kê yêu cầu đổi/trả hàng',
            error: error.message
        });
    }
};

/**
 * Lấy chi tiết yêu cầu đổi/trả hàng
 */
exports.getReturnRequestDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const returnRequest = await ReturnRequest.findById(id)
            .populate('orderId', 'orderId orderDate totalAmount status')
            .populate('items.productId', 'title thumbnail price stock')
            .populate('customerId', 'name email phone');

        if (!returnRequest) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu đổi/trả hàng'
            });
        }

        res.status(200).json({
            success: true,
            data: returnRequest
        });
    } catch (error) {
        console.error('Error fetching return request details:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy chi tiết yêu cầu đổi/trả hàng',
            error: error.message
        });
    }
};

/**
 * Cập nhật trạng thái yêu cầu đổi/trả hàng
 */
exports.updateReturnRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, note, adminName = 'Admin' } = req.body;

        // Kiểm tra trạng thái hợp lệ
        const validStatuses = ['pending', 'processing', 'approved', 'completed', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ'
            });
        }

        // Tìm yêu cầu
        const returnRequest = await ReturnRequest.findById(id);
        if (!returnRequest) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu đổi/trả hàng'
            });
        }

        // Cập nhật trạng thái và ghi chú
        returnRequest.adminNote = note || returnRequest.adminNote;
        await returnRequest.updateStatus(status, note, adminName);

        // Nếu trạng thái là 'approved' hoặc 'completed', cập nhật stock cho sản phẩm
        if (status === 'completed' && returnRequest.status !== 'completed') {
            // Cập nhật lại stock sản phẩm
            for (const item of returnRequest.items) {
                const product = await Product.findById(item.productId);
                if (product) {
                    product.stock += item.quantity;
                    await product.save();
                }
            }
        }

        res.status(200).json({
            success: true,
            message: 'Đã cập nhật trạng thái yêu cầu đổi/trả hàng',
            data: returnRequest
        });
    } catch (error) {
        console.error('Error updating return request status:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật trạng thái yêu cầu đổi/trả hàng',
            error: error.message
        });
    }
};

/**
 * Thêm sản phẩm thay thế cho yêu cầu đổi hàng
 */
exports.addExchangeItems = async (req, res) => {
    try {
        const { id } = req.params;
        const { exchangeItems } = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (!Array.isArray(exchangeItems) || exchangeItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách sản phẩm thay thế không hợp lệ'
            });
        }

        // Tìm yêu cầu
        const returnRequest = await ReturnRequest.findById(id);
        if (!returnRequest) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu đổi/trả hàng'
            });
        }

        // Kiểm tra loại yêu cầu
        if (returnRequest.requestType !== 'exchange') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể thêm sản phẩm thay thế cho yêu cầu đổi hàng'
            });
        }

        // Kiểm tra và xác thực các sản phẩm thay thế
        const validatedExchangeItems = [];
        for (const item of exchangeItems) {
            const { productId, quantity } = item;
            
            // Kiểm tra sản phẩm tồn tại
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Không tìm thấy sản phẩm ID ${productId}`
                });
            }
            
            // Kiểm tra số lượng tồn kho
            if (product.stock < quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Sản phẩm '${product.title}' không đủ số lượng trong kho (yêu cầu: ${quantity}, còn: ${product.stock})`
                });
            }
            
            validatedExchangeItems.push({
                productId,
                quantity
            });
        }

        // Cập nhật sản phẩm thay thế
        returnRequest.exchangeItems = validatedExchangeItems;
        await returnRequest.save();

        res.status(200).json({
            success: true,
            message: 'Đã thêm sản phẩm thay thế cho yêu cầu đổi hàng',
            data: returnRequest
        });
    } catch (error) {
        console.error('Error adding exchange items:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi thêm sản phẩm thay thế',
            error: error.message
        });
    }
}; 