const Order = require('../../models/order.model');
const OrderItem = require('../../models/orderItem.model');
const { sendOrderStatusEmail, sendEmailSuccess } = require('../../../config/mailer');
const Discount = require('../../models/discount.model');
const Product = require('../../models/products.model');
const OrderTracking = require('../../models/orderTracking.model');
const RefundRequest = require('../../models/refundRequest.model');
const transporter = require('../../../config/mailer').transporter;
const mongoose = require('mongoose');

function roundToTwo(num) {
    return Math.round(num * 100) / 100;
}

module.exports.createOrder = async (req, res) => {
    try {
        // Log req.body for debugging
        console.log('Request Body:', req.body);

        const { 
            customerName, 
            customerPhone, 
            customerEmail, 
            shippingAddress,
            customerId, // Thêm customerId
            status = 'Đang xác nhận', // Default status 
            totalAmount: requestTotalAmount, // Đổi tên biến để tránh gán lại giá trị
            paymentMethod, 
            paymentStatus = 'Chưa thanh toán', // Default payment status
            items, 
            discountCode 
        } = req.body;

        // Validate required fields
        if (!customerName || !customerPhone || !shippingAddress || !customerEmail || !requestTotalAmount || !items) {
            return res.status(400).json({
                code: 400,
                message: 'Missing required fields in request body'
            });
        }

        // Validate status is valid enum value
        const validStatuses = ['Đang xác nhận', 'Đang đóng gói', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                code: 400,
                message: 'Invalid order status'
            });
        }

        // Validate payment method is valid enum value
        const validPaymentMethods = ['Thanh toán khi nhận hàng', 'Chuyển khoản qua ngân hàng'];
        if (!validPaymentMethods.includes(paymentMethod)) {
            return res.status(400).json({
                code: 400,
                message: 'Invalid payment method'
            });
        }

        // Validate payment status is valid enum value
        const validPaymentStatuses = ['Chưa thanh toán', 'Đã thanh toán'];
        if (!validPaymentStatuses.includes(paymentStatus)) {
            return res.status(400).json({
                code: 400,
                message: 'Invalid payment status'
            });
        }

        // Calculate total amount from items
        let calculatedTotalAmount = 0;
        for (const item of items) {
            calculatedTotalAmount += item.price * item.quantity;
        }

        // Store original amount before any discounts
        const totalAmountBeforeDiscount = roundToTwo(calculatedTotalAmount);

        // Check discount code if provided
        let discount = null;
        if (discountCode) {
            discount = await Discount.findOne({ code: discountCode });
            if (!discount || discount.quantity <= 0 || discount.expirationDate < new Date()) {
                return res.status(400).json({
                    code: 400,
                    message: 'Invalid or expired discount code'
                });
            }
           
            discount.quantity -= 1;
            calculatedTotalAmount -= discount.amount;
            await discount.save();
        }

        // Round the calculated total amount
        calculatedTotalAmount = roundToTwo(calculatedTotalAmount);
        const roundedRequestTotal = roundToTwo(requestTotalAmount);
        console.log("calculatedTotalAmount:", calculatedTotalAmount);
        console.log("roundedRequestTotal:", roundedRequestTotal);

        // Verify that the frontend-calculated total matches our calculation
        if (calculatedTotalAmount !== roundedRequestTotal) {
            // Restore discount if totals don't match
            if (discount) {
                discount.quantity += 1;
                await discount.save();
            }
            return res.status(400).json({
                code: 400,
                message: 'Total amount does not match calculated amount'
            });
        }

        // Create the order
        const order = new Order({
            orderId: `ORD-${Date.now()}`, // Generate unique order ID
            customerName,
            customerPhone,
            customerEmail,
            shippingAddress,
            customerId: mongoose.Types.ObjectId.isValid(customerId) ? new mongoose.Types.ObjectId(customerId) : customerId,
            status, 
            totalAmountBeforeDiscount, // Add the amount before discount
            totalAmount: calculatedTotalAmount,
            paymentMethod,
            paymentStatus,
            discount: discount ? discount._id : null
        });

        await order.save();

        // Create initial order tracking record
        const orderTracking = new OrderTracking({
            orderId: order._id,
            orderCode: order.orderId,
            status: 'Đã đặt hàng',
            description: 'Đơn hàng đã được tạo thành công',
            updatedBy: 'system'
        });
        await orderTracking.save();

        // Send confirmation email to customer
        try {
            await sendEmailSuccess(req.body.customerEmail, order.orderId, order.status);
        } catch (emailError) {
            console.error('Error sending order confirmation email:', emailError);
            // Continue with order creation even if email fails
        }

        // Create order items
        const orderItems = items.map(item => ({
            orderId: order._id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
        }));

        // Update product stock
        for (const item of orderItems) {
            const product = await Product.findById(item.productId);
            if (product) {
                product.stock -= item.quantity;
                await product.save();
            }
        }

        // Save order items
        await OrderItem.insertMany(orderItems);

        res.status(201).json({
            code: 201,
            message: 'Đơn hàng đã được tạo thành công',
            order
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(400).json({
            code: 400,
            message: 'Lỗi khi tạo đơn hàng: ' + error.message
        });
    }
};

/**
 * Get an order by ID
 * @route GET /api/customer/orders/:id
 */
module.exports.getOrderById = async (req, res) => {
    try {
        console.log("Get order by ID:", req.params.id);

        // Find the order
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({
                code: 404,
                message: 'Order not found'
            });
        }

        // Find order items with populated product details
        const orderItems = await OrderItem.find({ orderId: order._id }).populate('productId');

        // Get order tracking history
        const orderTracking = await OrderTracking.find({ orderId: order._id }).sort({ createdAt: 1 });

        // Return order details, items, and tracking history
        res.status(200).json({
            order,
            orderItems,
            orderTracking
        });
    } catch (error) {
        console.error('Error fetching order by ID:', error);
        res.status(400).json({
            code: 400,
            message: error.message
        });
    }
};

/**
 * Get all orders of a customer
 * @route GET /api/customer/orders/get-all-order-of-customer/:customerId
 * @query page - Page number (optional, default: 1)
 * @query limit - Items per page (optional, default: 10)
 */
module.exports.getAllOrderOfCustomer = async (req, res) => {
    try {
        const { customerId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        if (!customerId) {
            return res.status(400).json({
                code: 400,
                message: 'Customer ID là bắt buộc'
            });
        }
        
        // Parse pagination params
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        
        // Get total count for pagination
        let query = {};
        try {
            // Kiểm tra xem customerId có phải ObjectId hợp lệ không
            if (mongoose.Types.ObjectId.isValid(customerId)) {
                query.customerId = new mongoose.Types.ObjectId(customerId);
            } else {
                query.customerId = customerId;
            }
        } catch (err) {
            query.customerId = customerId;
        }

        const totalOrders = await Order.countDocuments(query);
        
        // Find orders with pagination
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
            
        res.status(200).json({
            code: 200,
            message: 'Lấy danh sách đơn hàng thành công',
            data: {
                orders,
                pagination: {
                    total: totalOrders,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(totalOrders / limitNum)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching all orders of customer:', error);
        res.status(500).json({
            code: 500,
            message: 'Lỗi khi lấy danh sách đơn hàng: ' + error.message
        });
    }
};

/**
 * Get all orders for a customer
 * @route GET /api/customer/orders/customer/:customerId
 */
module.exports.getOrdersByCustomer = async (req, res) => {
    try {
        const { customerId } = req.params;
        
        if (!customerId) {
            return res.status(400).json({
                code: 400,
                message: 'Customer ID is required'
            });
        }
        
        // Find all orders for the customer
        let query = {};
        try {
            // Kiểm tra xem customerId có phải ObjectId hợp lệ không
            if (mongoose.Types.ObjectId.isValid(customerId)) {
                query.customerId = new mongoose.Types.ObjectId(customerId);
            } else {
                query.customerId = customerId;
            }
        } catch (err) {
            query.customerId = customerId;
        }

        const orders = await Order.find(query).sort({ createdAt: -1 });
        
        res.status(200).json({
            code: 200,
            message: 'Lấy danh sách đơn hàng thành công',
            data: orders
        });
    } catch (error) {
        console.error('Error fetching customer orders:', error);
        res.status(500).json({
            code: 500,
            message: 'Lỗi khi lấy danh sách đơn hàng: ' + error.message
        });
    }
};

/**
 * Get customer orders with status filtering
 * @route GET /api/customer/orders/filter
 * @query customerId - Customer ID
 * @query status - Order status to filter (optional)
 * @query page - Page number (optional, default: 1)
 * @query limit - Items per page (optional, default: 10)
 */
module.exports.getFilteredOrdersByCustomer = async (req, res) => {
    try {
        const { customerId, status, page = 1, limit = 10 } = req.query;
        
        // Validate required fields
        if (!customerId) {
            return res.status(400).json({
                code: 400,
                message: 'Customer ID là bắt buộc'
            });
        }
        
        // Build query object
        let query = {};
        try {
            // Kiểm tra xem customerId có phải ObjectId hợp lệ không
            if (mongoose.Types.ObjectId.isValid(customerId)) {
                query.customerId = new mongoose.Types.ObjectId(customerId);
            } else {
                query.customerId = customerId;
            }
        } catch (err) {
            query.customerId = customerId;
        }
        
        // Add status filter if provided
        if (status) {
            // Validate status is valid enum value
            const validStatuses = ['Đang xác nhận', 'Đang đóng gói', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    code: 400,
                    message: 'Trạng thái đơn hàng không hợp lệ'
                });
            }
            query.status = status;
        }
        
        // Parse pagination params
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        
        // Get total count for pagination
        const totalOrders = await Order.countDocuments(query);
        
        // Find orders with pagination
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
            
        // Count orders by status for summary
        let matchStage = {};
        try {
            // Kiểm tra xem customerId có phải ObjectId hợp lệ không
            if (mongoose.Types.ObjectId.isValid(customerId)) {
                matchStage = { customerId: new mongoose.Types.ObjectId(customerId) };
            } else {
                matchStage = { customerId: customerId };
            }
        } catch (err) {
            matchStage = { customerId: customerId };
        }

        const statusCounts = await Order.aggregate([
            { $match: matchStage },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        
        // Transform aggregation result to more readable object
        const orderStatusSummary = {};
        
        // Initialize with all possible statuses set to 0
        const allStatuses = ['Đang xác nhận', 'Đang đóng gói', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy'];
        allStatuses.forEach(status => {
            orderStatusSummary[status] = 0;
        });
        
        // Update with actual counts
        statusCounts.forEach(item => {
            if (item._id) {
                orderStatusSummary[item._id] = item.count;
            }
        });
        
        // Return response with pagination info
        res.status(200).json({
            code: 200,
            message: 'Lấy danh sách đơn hàng thành công',
            data: {
                orders,
                pagination: {
                    total: totalOrders,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(totalOrders / limitNum)
                },
                summary: orderStatusSummary
            }
        });
    } catch (error) {
        console.error('Error fetching filtered customer orders:', error);
        res.status(500).json({
            code: 500,
            message: 'Lỗi khi lấy danh sách đơn hàng: ' + error.message
        });
    }
};

/**
 * Update order status
 * @route PATCH /api/customer/orders/:id/status
 * Admin-only endpoint
 */
module.exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, description } = req.body;
        
        if (!status) {
            return res.status(400).json({
                code: 400,
                message: 'Status is required'
            });
        }
        
        // Find and update the order
        const order = await Order.findByIdAndUpdate(
            id, 
            { status }, 
            { new: true }
        );
        
        if (!order) {
            return res.status(404).json({
                code: 404,
                message: 'Order not found'
            });
        }
        
        // Add to order tracking history
        const orderTracking = new OrderTracking({
            orderId: order._id,
            orderCode: order.orderId,
            status,
            description: description || `Đơn hàng đã được cập nhật trạng thái thành ${status}`,
            updatedBy: req.user?.name || 'admin'
        });
        await orderTracking.save();
        
        // If status is "Đã hủy", restore product stock
        if (status === 'Đã hủy') {
            const orderItems = await OrderItem.find({ orderId: order._id });
            
            for (const item of orderItems) {
                const product = await Product.findById(item.productId);
                if (product) {
                    product.stock += item.quantity;
                    await product.save();
                }
            }
        }
        
        // Send email notification to customer about status change
        await sendEmailSuccess(order.customerEmail, order.orderId, order.status);
        
        res.status(200).json(order);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(400).json({
            code: 400,
            message: error.message
        });
    }
};

/**
 * Cancel order (customer-facing endpoint)
 * @route PATCH /api/customer/orders/:id/cancel
 */
module.exports.cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        
        // Validate reason is provided
        if (!reason || reason.trim() === '') {
            return res.status(400).json({
                code: 400,
                message: 'Lý do hủy đơn hàng là bắt buộc'
            });
        }
        
        // Find the order
        const order = await Order.findById(id);
        
        if (!order) {
            return res.status(404).json({
                code: 404,
                message: 'Không tìm thấy đơn hàng'
            });
        }
        
        // Check if order can be canceled based on status
        const cancelableStatuses = ['Đang xác nhận', 'Đang đóng gói'];
        if (!cancelableStatuses.includes(order.status)) {
            return res.status(400).json({
                code: 400,
                message: `Không thể hủy đơn hàng có trạng thái: ${order.status}`
            });
        }
        
        // Check payment status
        const paymentStatus = order.paymentStatus || 'Chưa thanh toán';
        
        // Update order status and add cancellation reason
        order.status = 'Đã hủy';
        order.cancellationReason = reason;
        order.cancelDate = new Date();
        await order.save();
        
        // Add to order tracking history
        const orderTracking = new OrderTracking({
            orderId: order._id,
            orderCode: order.orderId,
            status: 'Đã hủy',
            description: `Đơn hàng đã bị hủy: ${reason}`,
            updatedBy: 'customer'
        });
        await orderTracking.save();
        
        // Restore product stock
        const orderItems = await OrderItem.find({ orderId: order._id });
        
        for (const item of orderItems) {
            const product = await Product.findById(item.productId);
            if (product) {
                product.stock += item.quantity;
                await product.save();
            }
        }
        
        // Check if there was a discount applied to the order
        if (order.discount) {
            try {
                const discount = await Discount.findById(order.discount);
                if (discount && discount.usageLimit) {
                    // If the discount has a usage limit, increment it back
                    discount.quantity = Math.max(0, discount.quantity + 1);
                    await discount.save();
                }
            } catch (discountError) {
                console.error('Error restoring discount usage:', discountError);
                // Continue with cancellation even if discount restore fails
            }
        }
        
        // Send email notification about cancellation
        try {
            await sendEmailSuccess(order.customerEmail, order.orderId, 'Đã hủy');
        } catch (emailError) {
            console.error('Error sending cancellation email:', emailError);
            // Continue with cancellation even if email fails
        }
        
        // Return different responses based on payment status
        if (paymentStatus === 'Đã thanh toán') {
            return res.status(200).json({
                code: 200,
                message: 'Đơn hàng đã hủy thành công. Vui lòng gửi yêu cầu hoàn tiền.',
                order,
                requiresRefund: true
            });
        } else {
            return res.status(200).json({
                code: 200,
                message: 'Đơn hàng đã hủy thành công',
                order,
                requiresRefund: false   
            });
        }
    } catch (error) {
        console.error('Error canceling order:', error);
        res.status(500).json({
            code: 500,
            message: 'Lỗi khi hủy đơn hàng: ' + error.message
        });
    }
};

// Add new method for refund requests
module.exports.createRefundRequest = async (req, res) => {
    try {
        const {
            orderId,
            customerName,
            bankName,
            bankAccountNumber,
            bankAccountName,
            reason
        } = req.body;
        
        // Validate required fields
        if (!orderId || !customerName || !bankName || !bankAccountNumber || !bankAccountName || !reason) {
            return res.status(400).json({
                code: 400,
                message: 'Vui lòng cung cấp đầy đủ thông tin để yêu cầu hoàn tiền'
            });
        }
        
        const refundedRequest = await RefundRequest.findOne({ orderId: orderId });
        if (refundedRequest) {
            return res.status(400).json({
                code: 400,
                message: 'Yêu cầu hoàn tiền đã tồn tại cho đơn hàng này'
            });
        }

        // Find the order
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({
                code: 404,
                message: 'Không tìm thấy đơn hàng'
            });
        }
        
        // Check if order is canceled and payment status is "Đã thanh toán"
        if (order.status !== 'Đã hủy') {
            return res.status(400).json({
                code: 400,
                message: 'Chỉ có thể yêu cầu hoàn tiền cho đơn hàng đã hủy'
            });
        }
        
        if (order.paymentStatus !== 'Đã thanh toán') {
            return res.status(400).json({
                code: 400,
                message: 'Chỉ có thể yêu cầu hoàn tiền cho đơn hàng đã thanh toán'
            });
        }
        
        // Check if refund request already exists
        const existingRequest = await RefundRequest.findOne({ orderId: order._id });
        
        if (existingRequest) {
            return res.status(400).json({
                code: 400,
                message: 'Yêu cầu hoàn tiền đã tồn tại cho đơn hàng này',
                refundRequest: existingRequest
            });
        }
        
        // Create refund request
        const refundRequest = new RefundRequest({
            orderId: order._id,
            orderCode: order.orderId,
            customerName,
            customerEmail: order.customerEmail,
            customerPhone: order.customerPhone,
            bankName,
            bankAccountNumber,
            bankAccountName,
            amount: order.totalAmount,
            reason
        });
        
        await refundRequest.save();
        
        // Send email notification about refund request
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: order.customerEmail,
                subject: `Yêu cầu hoàn tiền cho đơn hàng #${order.orderId} đã được ghi nhận`,
                text: `Chúng tôi đã nhận được yêu cầu hoàn tiền cho đơn hàng #${order.orderId}.
                Số tiền hoàn trả: ${order.totalAmount.toLocaleString('vi-VN')} VND
                Tài khoản nhận tiền: ${bankAccountNumber} - ${bankAccountName} - ${bankName}
                Chúng tôi sẽ xử lý yêu cầu của bạn trong thời gian sớm nhất.
                Xin cảm ơn.`
            };
            
            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.error('Error sending refund request email:', emailError);
            // Continue with refund request creation even if email fails
        }
        
        res.status(201).json({
            code: 201,
            message: 'Yêu cầu hoàn tiền đã được ghi nhận',
            refundRequest
        });
    } catch (error) {
        console.error('Error creating refund request:', error);
        res.status(500).json({
            code: 500,
            message: 'Lỗi khi tạo yêu cầu hoàn tiền: ' + error.message
        });
    }
};

/**
 * Check refund status for an order
 * @route GET /api/customer/orders/refund-status/:orderId
 */
module.exports.getRefundStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { email } = req.query;

        // Validate required parameters
        if (!orderId) {
            return res.status(400).json({
                code: 400,
                message: 'Mã đơn hàng là bắt buộc'
            });
        }

        // Find the order
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({
                code: 404,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        // If email is provided, verify it matches the order's email
        if (email && email !== order.customerEmail) {
            return res.status(403).json({
                code: 403,
                message: 'Email không khớp với đơn hàng'
            });
        }

        // Check if order is canceled
        if (order.status !== 'Đã hủy') {
            return res.status(400).json({
                code: 400,
                message: 'Đơn hàng chưa được hủy',
                orderStatus: order.status
            });
        }

        // Check payment status
        if (order.paymentStatus !== 'Đã thanh toán') {
            return res.status(400).json({
                code: 400,
                message: 'Đơn hàng chưa thanh toán nên không cần hoàn tiền',
                paymentStatus: order.paymentStatus
            });
        }

        // Find refund request for the order
        const refundRequest = await RefundRequest.findOne({ orderId: order._id });

        if (!refundRequest) {
            return res.status(404).json({
                code: 404,
                message: 'Chưa có yêu cầu hoàn tiền cho đơn hàng này',
                order: {
                    _id: order._id,
                    orderId: order.orderId,
                    status: order.status,
                    totalAmount: order.totalAmount,
                    paymentStatus: order.paymentStatus,
                    cancellationReason: order.cancellationReason
                }
            });
        }

        // Return refund status details
        res.status(200).json({
            code: 200,
            message: 'Thông tin yêu cầu hoàn tiền',
            refundStatus: {
                orderCode: refundRequest.orderCode,
                customerName: refundRequest.customerName,
                amount: refundRequest.amount,
                bankInfo: {
                    bankName: refundRequest.bankName,
                    accountNumber: refundRequest.bankAccountNumber,
                    accountName: refundRequest.bankAccountName
                },
                status: refundRequest.status,
                createdAt: refundRequest.createdAt,
                processedAt: refundRequest.processedAt,
                notes: refundRequest.status === 'Từ chối' ? refundRequest.adminNotes : undefined
            }
        });
    } catch (error) {
        console.error('Error checking refund status:', error);
        res.status(500).json({
            code: 500,
            message: 'Lỗi khi kiểm tra trạng thái hoàn tiền: ' + error.message
        });
    }
};

/**
 * Get order status summary for a customer
 * @route GET /api/customer/orders/status-summary/:customerId
 */
module.exports.getOrderStatusSummary = async (req, res) => {
    try {
        const { customerId } = req.params;
        
        if (!customerId) {
            return res.status(400).json({
                code: 400,
                message: 'Customer ID là bắt buộc'
            });
        }

        // Count orders by status
        let matchStage = {};
        try {
            // Kiểm tra xem customerId có phải ObjectId hợp lệ không
            if (mongoose.Types.ObjectId.isValid(customerId)) {
                matchStage = { customerId: new mongoose.Types.ObjectId(customerId) };
            } else {
                matchStage = { customerId: customerId };
            }
        } catch (err) {
            matchStage = { customerId: customerId };
        }

        const statusCounts = await Order.aggregate([
            { $match: matchStage },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        
        // Transform aggregation result to more readable object
        const orderStatusSummary = {};
        
        // Initialize with all possible statuses set to 0
        const allStatuses = ['Đang xác nhận', 'Đang đóng gói', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy'];
        allStatuses.forEach(status => {
            orderStatusSummary[status] = 0;
        });
        
        // Update with actual counts
        statusCounts.forEach(item => {
            if (item._id) {
                orderStatusSummary[item._id] = item.count;
            }
        });
        
        // Get total orders count
        const totalOrders = await Order.countDocuments(matchStage);
        
        res.status(200).json({
            code: 200,
            message: 'Lấy thống kê trạng thái đơn hàng thành công',
            data: {
                summary: orderStatusSummary,
                total: totalOrders
            }
        });
    } catch (error) {
        console.error('Error fetching order status summary:', error);
        res.status(500).json({
            code: 500,
            message: 'Lỗi khi lấy thống kê trạng thái đơn hàng: ' + error.message
        });
    }
};
