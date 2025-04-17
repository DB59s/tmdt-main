const crypto = require('crypto');
const axios = require('axios');
const Order = require('../models/order.model');
const usdtConfig = {
    MERCHANT_WALLET: process.env.USDT_MERCHANT_WALLET || 'TYourWalletAddressHere',
    USDT_TO_VND_RATE: 24500, // Example fixed rate, consider using an API for real-time rates
    WEBHOOK_SECRET: process.env.USDT_WEBHOOK_SECRET || 'your-webhook-secret',
    NETWORK: process.env.USDT_NETWORK || 'tron', // tron network (TRC20)
    EXPLORER_API: 'https://apilist.tronscan.org/api',
    LABEL: 'Payment for order'
};

/**
 * Get current USDT to VND exchange rate
 * @returns {Promise<number>} - Current USDT price in VND
 */
const getUsdtRate = async () => {
    try {
        // You can replace this with a real API call to get the current rate
        // For example: const response = await axios.get('https://api.example.com/usdt-vnd-rate');
        // return response.data.rate;
        
        // For now, using a fixed rate
        return usdtConfig.USDT_TO_VND_RATE;
    } catch (error) {
        console.error('Error fetching USDT rate:', error);
        // Fallback to a default rate if API fails
        return usdtConfig.USDT_TO_VND_RATE;
    }
};

/**
 * Convert VND amount to USDT
 * @param {number} vndAmount - Amount in VND
 * @returns {Promise<number>} - Equivalent amount in USDT
 */
const convertVndToUsdt = async (vndAmount) => {
    try {
        // Get current USDT to VND rate
        const usdtRate = await getUsdtRate();
        
        // Convert VND to USDT
        const usdtAmount = vndAmount / usdtRate;
        
        // Round to 2 decimal places for USDT
        return parseFloat(usdtAmount.toFixed(2));
    } catch (error) {
        console.error('Error converting VND to USDT:', error);
        throw new Error('Không thể chuyển đổi tiền VND sang USDT');
    }
};

/**
 * Generate payment information for USDT transaction
 * @param {Object} order - Order details
 * @returns {Promise<Object>} - USDT payment data
 */
const generatePaymentInfo = async (order) => {
    try {
        // Convert VND amount to USDT
        const usdtAmount = await convertVndToUsdt(order.totalAmount);
        
        // Create a reference ID to identify the payment
        const reference = crypto.randomBytes(16).toString('hex');
        
        // Create payment info
        const paymentInfo = {
            merchantWallet: usdtConfig.MERCHANT_WALLET,
            amount: usdtAmount,
            reference: reference,
            network: 'TRC20 (Tron)',
            message: `Thanh toán đơn hàng ${order.orderId}`,
        };
        
        // Update order with USDT payment info
        await Order.findByIdAndUpdate(order._id, {
            paymentMethod: 'Thanh toán qua USDT',
            paymentStatus: 'Chưa thanh toán',
            'usdtPaymentInfo.reference': reference,
            'usdtPaymentInfo.amount': usdtAmount,
            'usdtPaymentInfo.amountInVnd': order.totalAmount,
            'usdtPaymentInfo.walletAddress': usdtConfig.MERCHANT_WALLET,
            'usdtPaymentInfo.network': 'TRC20',
            'usdtPaymentInfo.createdAt': new Date()
        });
        
        return {
            success: true,
            walletAddress: usdtConfig.MERCHANT_WALLET,
            amount: usdtAmount,
            amountInVnd: order.totalAmount,
            reference: reference,
            network: 'TRC20',
            orderId: order.orderId
        };
    } catch (error) {
        console.error('USDT payment error:', error);
        return {
            success: false,
            message: error.message || 'Lỗi khi tạo thanh toán USDT'
        };
    }
};

/**
 * Verify USDT payment status manually
 * @param {string} reference - Payment reference
 * @returns {Promise<Object>} - Payment verification result
 */
const verifyPayment = async (reference) => {
    try {
        // Find the order with this reference
        const order = await Order.findOne({
            'usdtPaymentInfo.reference': reference
        });
        
        if (!order) {
            return {
                success: false,
                message: 'Không tìm thấy đơn hàng'
            };
        }
        
        // In a real implementation, you would check the blockchain for the transaction
        // This would typically involve querying the Tron blockchain API to verify the payment
        // For demo purposes, we'll simulate a manual verification process
        
        // Return the current status
        return {
            success: true,
            verified: order.usdtPaymentInfo.verified || false,
            message: order.usdtPaymentInfo.verified 
                ? 'Thanh toán đã được xác nhận' 
                : 'Thanh toán đang chờ xác nhận',
            transactionId: order.usdtPaymentInfo.transactionId || null,
            order: order.orderId
        };
    } catch (error) {
        console.error('Error verifying USDT payment:', error);
        return {
            success: false,
            verified: false,
            message: 'Lỗi khi xác minh thanh toán'
        };
    }
};

/**
 * Manually confirm a USDT payment with transaction details
 * @param {string} reference - Payment reference
 * @param {string} transactionId - Transaction ID from the blockchain
 * @returns {Promise<Object>} - Payment confirmation result
 */
const confirmPayment = async (reference, transactionId) => {
    try {
        // Find the order with this reference
        const order = await Order.findOne({
            'usdtPaymentInfo.reference': reference
        });
        
        if (!order) {
            return {
                success: false,
                message: 'Không tìm thấy đơn hàng'
            };
        }
        
        // Update order payment status
        await Order.findByIdAndUpdate(order._id, {
            paymentStatus: 'Đã thanh toán',
            'usdtPaymentInfo.transactionId': transactionId,
            'usdtPaymentInfo.paymentDate': new Date(),
            'usdtPaymentInfo.verified': true
        });
        
        return {
            success: true,
            message: 'Thanh toán đã được xác nhận thành công',
            orderId: order.orderId
        };
    } catch (error) {
        console.error('Error confirming USDT payment:', error);
        return {
            success: false,
            message: 'Lỗi khi xác nhận thanh toán'
        };
    }
};

/**
 * Handle webhook for USDT payment notifications
 * @param {Object} webhookData - Webhook data
 * @returns {Promise<Object>} - Result of webhook processing
 */
const handleWebhook = async (webhookData) => {
    try {
        console.log('Received webhook for USDT payment:', JSON.stringify(webhookData, null, 2));
        
        // Extract data from webhook
        const { reference, transactionId, signature } = webhookData;
        
        if (!reference || !transactionId) {
            return {
                success: false,
                message: 'Missing required data in webhook'
            };
        }
        
        // Verify webhook signature if provided
        // This is a security measure to ensure the webhook is from a trusted source
        if (signature) {
            // Implement signature verification logic here
        }
        
        // Confirm the payment
        return await confirmPayment(reference, transactionId);
    } catch (error) {
        console.error('USDT webhook handling error:', error);
        return {
            success: false,
            message: 'Error processing payment notification'
        };
    }
};

module.exports = {
    generatePaymentInfo,
    verifyPayment,
    confirmPayment,
    handleWebhook,
    convertVndToUsdt
};
