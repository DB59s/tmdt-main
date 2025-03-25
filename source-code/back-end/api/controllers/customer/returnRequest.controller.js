const ReturnRequest = require('../../models/returnRequest.model');
const Order = require('../../models/order.model');
const OrderItem = require('../../models/orderItem.model');
const Product = require('../../models/products.model');
const mongoose = require('mongoose');

/**
 * Tạo yêu cầu đổi/trả hàng mới
 */
exports.createReturnRequest = async (req, res) => {
    try {
        const {
            orderId,
            requestType,
            reason,
            images,
            items,
            refundInfo
        } = req.body;

        // Kiểm tra thông tin bắt buộc
        if (!orderId || !requestType || !reason || !images || !items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc'
            });
        }

        // Kiểm tra loại yêu cầu hợp lệ
        if (!['exchange', 'refund'].includes(requestType)) {
            return res.status(400).json({
                success: false,
                message: 'Loại yêu cầu không hợp lệ, phải là "exchange" hoặc "refund"'
            });
        }

        // Kiểm tra thông tin hoàn tiền nếu là yêu cầu hoàn tiền
        if (requestType === 'refund') {
            if (!refundInfo || !refundInfo.bankName || !refundInfo.accountNumber || !refundInfo.accountHolder) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin ngân hàng để hoàn tiền'
                });
            }
        }

        // Lấy thông tin đơn hàng
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        // Kiểm tra trạng thái đơn hàng
        if (order.status !== 'Đã giao hàng') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ những đơn hàng đã giao mới có thể yêu cầu đổi/trả'
            });
        }

        // Kiểm tra sản phẩm đã thanh toán chưa
        if (order.paymentStatus !== 'Đã thanh toán') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ những đơn hàng đã thanh toán mới có thể yêu cầu đổi/trả'
            });
        }

        // Lấy thông tin các sản phẩm trong đơn hàng
        const orderItems = await OrderItem.find({ orderId: order._id });
        const orderItemMap = {};
        orderItems.forEach(item => {
            orderItemMap[item.productId.toString()] = item;
        });

        // Kiểm tra và tính tổng tiền hoàn trả
        let totalRefundAmount = 0;
        const validatedItems = [];

        for (const item of items) {
            const { productId, quantity, returnReason } = item;

            // Kiểm tra sản phẩm có trong đơn hàng không
            const orderItem = orderItemMap[productId];
            if (!orderItem) {
                return res.status(400).json({
                    success: false,
                    message: `Sản phẩm ID ${productId} không có trong đơn hàng`
                });
            }

            // Kiểm tra số lượng
            if (quantity > orderItem.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Số lượng yêu cầu đổi/trả (${quantity}) vượt quá số lượng đã mua (${orderItem.quantity})`
                });
            }

            // Tính tiền hoàn trả cho sản phẩm này
            const refundAmount = orderItem.price * quantity;
            totalRefundAmount += refundAmount;

            // Thêm vào danh sách sản phẩm hợp lệ
            validatedItems.push({
                productId: productId,
                quantity: quantity,
                price: orderItem.price,
                returnReason: returnReason
            });
        }

        // Tạo yêu cầu đổi/trả hàng mới
        const returnRequest = new ReturnRequest({
            orderId: order._id,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            customerPhone: order.customerPhone,
            customerId: order.customerId,
            requestType: requestType,
            reason: reason,
            images: images,
            items: validatedItems,
            totalRefundAmount: totalRefundAmount,
            status: 'pending',
            statusHistory: [{
                status: 'pending',
                note: 'Yêu cầu đổi/trả hàng đã được tạo',
                updatedBy: 'customer',
                updatedAt: new Date()
            }]
        });

        // Thêm thông tin hoàn tiền nếu là yêu cầu hoàn tiền
        if (requestType === 'refund') {
            returnRequest.refundInfo = refundInfo;
        }

        // Lưu yêu cầu
        await returnRequest.save();

        res.status(201).json({
            success: true,
            message: 'Yêu cầu đổi/trả hàng đã được tạo',
            data: returnRequest
        });
    } catch (error) {
        console.error('Error creating return request:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo yêu cầu đổi/trả hàng',
            error: error.message
        });
    }
};

/**
 * Lấy danh sách yêu cầu đổi/trả hàng của khách hàng
 */
exports.getCustomerReturnRequests = async (req, res) => {
    try {
        const customerId = req.params.customerId;

        if (!customerId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu ID khách hàng'
            });
        }

        // Lấy danh sách yêu cầu của khách hàng
        const returnRequests = await ReturnRequest.find({ customerId })
            .sort({ createdAt: -1 })
            .populate('orderId', 'orderId orderDate totalAmount');

        res.status(200).json({
            success: true,
            count: returnRequests.length,
            data: returnRequests
        });
    } catch (error) {
        console.error('Error fetching customer return requests:', error);
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
            .populate('items.productId', 'title thumbnail price');

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
 * Cập nhật yêu cầu đổi/trả hàng (chỉ cho phép cập nhật khi trạng thái là 'pending')
 */
exports.updateReturnRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Tìm yêu cầu hiện tại
        const returnRequest = await ReturnRequest.findById(id);

        if (!returnRequest) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu đổi/trả hàng'
            });
        }

        // Chỉ cho phép cập nhật khi trạng thái là 'pending'
        if (returnRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể cập nhật yêu cầu khi trạng thái là đang chờ xử lý'
            });
        }

        // Danh sách trường có thể cập nhật
        const allowedUpdates = ['reason', 'images', 'items', 'refundInfo'];
        const updateFields = {};

        // Lọc các trường được phép cập nhật
        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updateFields[key] = updates[key];
            }
        });

        // Nếu cập nhật items, cần tính lại tổng tiền hoàn trả
        if (updateFields.items && Array.isArray(updateFields.items)) {
            // Lấy thông tin các sản phẩm trong đơn hàng
            const orderItems = await OrderItem.find({ orderId: returnRequest.orderId });
            const orderItemMap = {};
            orderItems.forEach(item => {
                orderItemMap[item.productId.toString()] = item;
            });

            // Xử lý từng sản phẩm trong danh sách cập nhật
            const validatedItems = [];
            let totalRefundAmount = 0;

            for (const item of updateFields.items) {
                const { productId, quantity, returnReason } = item;
                
                // Tìm sản phẩm trong đơn hàng gốc
                const orderItem = orderItemMap[productId];
                if (!orderItem) {
                    return res.status(400).json({
                        success: false,
                        message: `Sản phẩm ID ${productId} không có trong đơn hàng`
                    });
                }

                // Kiểm tra số lượng
                if (quantity > orderItem.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Số lượng yêu cầu đổi/trả (${quantity}) vượt quá số lượng đã mua (${orderItem.quantity})`
                    });
                }

                // Lấy giá từ đơn hàng gốc hoặc giữ giá cũ nếu có
                const price = orderItem.price;
                
                // Tính tiền hoàn trả cho sản phẩm này
                const refundAmount = price * quantity;
                totalRefundAmount += refundAmount;

                // Thêm vào danh sách hợp lệ
                validatedItems.push({
                    productId,
                    quantity,
                    price, 
                    returnReason: returnReason || item.returnReason || 'Không được chỉ định'
                });
            }

            // Cập nhật danh sách sản phẩm và tổng tiền hoàn trả
            updateFields.items = validatedItems;
            updateFields.totalRefundAmount = totalRefundAmount;
        }

        // Cập nhật yêu cầu
        const updatedReturnRequest = await ReturnRequest.findByIdAndUpdate(
            id, 
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Yêu cầu đổi/trả hàng đã được cập nhật',
            data: updatedReturnRequest
        });
    } catch (error) {
        console.error('Error updating return request:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật yêu cầu đổi/trả hàng',
            error: error.message
        });
    }
};

/**
 * Hủy yêu cầu đổi/trả hàng (chỉ cho phép hủy khi trạng thái là 'pending')
 */
exports.cancelReturnRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        // Tìm yêu cầu hiện tại
        const returnRequest = await ReturnRequest.findById(id);

        if (!returnRequest) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu đổi/trả hàng'
            });
        }

        // Chỉ cho phép hủy khi trạng thái là 'pending'
        if (returnRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể hủy yêu cầu khi trạng thái là đang chờ xử lý'
            });
        }

        // Cập nhật trạng thái
        await returnRequest.updateStatus('rejected', `Đã hủy bởi khách hàng: ${reason || 'Không có lý do'}`, 'customer');

        res.status(200).json({
            success: true,
            message: 'Đã hủy yêu cầu đổi/trả hàng',
            data: returnRequest
        });
    } catch (error) {
        console.error('Error canceling return request:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi hủy yêu cầu đổi/trả hàng',
            error: error.message
        });
    }
}; 