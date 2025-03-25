const ReturnRequest = require('../../models/returnRequest.model');
const Order = require('../../models/order.model');
const OrderItem = require('../../models/orderItem.model');
const Product = require('../../models/products.model');
const mongoose = require('mongoose');

/**
 * Lấy danh sách tất cả yêu cầu đổi/trả hàng với phân trang và lọc
 */
exports.getAllReturnRequests = async (req, res) => {
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