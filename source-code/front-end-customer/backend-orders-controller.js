// This file contains the updated backend controller code for Orders
// It should be integrated into your actual backend codebase

const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const OrderTracking = require('../models/OrderTracking');
const Product = require('../models/Product');
const Discount = require('../models/Discount');
const { sendEmailSuccess } = require('../utils/email');

// Utility function to round to 2 decimal places
const roundToTwo = (num) => {
    return +(Math.round(num + "e+2") + "e-2");
};

/**
 * Create a new order
 * @route POST /api/customer/orders
 */
module.exports.createOrder = async (req, res) => {
    try {
        // Log req.body for debugging
        console.log('Request Body:', req.body);

        const { 
            customerName, 
            customerPhone, 
            customerEmail, 
            shippingAddress, 
            status = 'Đang xác nhận', // Default status 
            totalAmount, 
            paymentMethod, 
            paymentStatus = 'Chưa thanh toán', // Default payment status
            items, 
            discountCode 
        } = req.body;

        // Validate required fields
        if (!customerName || !customerPhone || !shippingAddress || !customerEmail || !totalAmount || !items) {
            return res.status(400).json({
                code: 400,
                message: 'Missing required fields in request body'
            });
        }

        // Calculate total amount from items
        let calculatedTotalAmount = 0;
        for (const item of items) {
            calculatedTotalAmount += item.price * item.quantity;
        }

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

        // Verify that the frontend-calculated total matches our calculation
        if (calculatedTotalAmount !== totalAmount) {
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
            status, 
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
        await sendEmailSuccess(req.body.customerEmail, order.orderId, order.status);

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

        res.status(201).json(order);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(400).json({
            code: 400,
            message: error.message
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
 * Get all orders for a customer
 * @route GET /api/customer/orders/customer/:email
 */
module.exports.getOrdersByCustomer = async (req, res) => {
    try {
        const { email } = req.params;
        
        if (!email) {
            return res.status(400).json({
                code: 400,
                message: 'Customer email is required'
            });
        }
        
        // Find all orders for the customer
        const orders = await Order.find({ customerEmail: email }).sort({ createdAt: -1 });
        
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching customer orders:', error);
        res.status(400).json({
            code: 400,
            message: error.message
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
        
        // Find and update the order
        const order = await Order.findById(id);
        
        if (!order) {
            return res.status(404).json({
                code: 404,
                message: 'Order not found'
            });
        }
        
        // Check if order can be canceled
        const nonCancelableStatuses = ['Đã giao hàng', 'Đã hủy', 'Đang giao hàng'];
        if (nonCancelableStatuses.includes(order.status)) {
            return res.status(400).json({
                code: 400,
                message: `Cannot cancel order with status: ${order.status}`
            });
        }
        
        // Update order status
        order.status = 'Đã hủy';
        await order.save();
        
        // Add to order tracking history
        const orderTracking = new OrderTracking({
            orderId: order._id,
            orderCode: order.orderId,
            status: 'Đã hủy',
            description: reason ? `Đơn hàng đã bị hủy: ${reason}` : 'Đơn hàng đã bị hủy bởi khách hàng',
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
        
        // Send email notification about cancellation
        await sendEmailSuccess(order.customerEmail, order.orderId, order.status);
        
        res.status(200).json({
            code: 200,
            message: 'Order canceled successfully',
            order
        });
    } catch (error) {
        console.error('Error canceling order:', error);
        res.status(400).json({
            code: 400,
            message: error.message
        });
    }
};
