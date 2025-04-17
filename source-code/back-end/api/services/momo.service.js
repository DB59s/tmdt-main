const crypto = require('crypto');
const axios = require('axios');
const momoConfig = require('../../config/momo.config');
const Order = require('../models/order.model');

/**
 * Generate a signature for Momo payment
 * @param {Object} data - Data to sign
 * @returns {string} - The signature
 */
const generateSignature = (data) => {
    // Tạo chuỗi rawSignature theo format của Momo
    const rawSignature = `accessKey=${momoConfig.ACCESS_KEY}&amount=${data.amount}&extraData=${data.extraData}&ipnUrl=${momoConfig.IPN_URL}&orderId=${data.orderId}&orderInfo=${data.orderInfo}&partnerCode=${momoConfig.PARTNER_CODE}&redirectUrl=${momoConfig.REDIRECT_URL}&requestId=${data.requestId}&requestType=${data.requestType}`;
    
    console.log('Raw signature:', rawSignature);
    
    // Tạo signature bằng HMAC SHA256
    const hmac = crypto.createHmac('sha256', momoConfig.SECRET_KEY);
    const signed = hmac.update(Buffer.from(rawSignature, 'utf-8')).digest('hex');
    
    return signed;
};

/**
 * Generate payment data for Momo QR code
 * @param {Object} order - Order details
 * @returns {Promise<Object>} - Momo payment data
 */
const generateQRCode = async (order) => {
    try {
        const requestId = `${Date.now()}_${order.orderId}`;
        const orderId = `${Date.now()}_${order.orderId}`;
        const orderInfo = `Thanh toán đơn hàng ${order.orderId}`;
        const extraData = order._id.toString();
        
        // Chuẩn bị dữ liệu cho request
        const requestData = {
            partnerCode: momoConfig.PARTNER_CODE,
            accessKey: momoConfig.ACCESS_KEY,
            requestId: requestId,
            amount: order.totalAmount,
            orderId: orderId,
            orderInfo: orderInfo,
            redirectUrl: momoConfig.REDIRECT_URL,
            ipnUrl: momoConfig.IPN_URL,
            extraData: extraData,
            requestType: 'captureWallet',
            lang: 'vi',
        };
        
        // Generate signature
        requestData.signature = generateSignature(requestData);
        
        console.log('Request data to Momo:', JSON.stringify(requestData, null, 2));
        
        // Call Momo API
        const response = await axios.post(momoConfig.MOMO_ENDPOINT, requestData);
        
        console.log('Momo API response:', JSON.stringify(response.data, null, 2));
        
        if (response.data.resultCode === 0) {
            // Update order with Momo payment info
            await Order.findByIdAndUpdate(order._id, {
                'momoPaymentInfo.partnerCode': momoConfig.PARTNER_CODE,
                'momoPaymentInfo.orderId': orderId,
                'momoPaymentInfo.requestId': requestId,
                'momoPaymentInfo.amount': order.totalAmount,
                'momoPaymentInfo.qrCodeUrl': response.data.qrCodeUrl,
                'momoPaymentInfo.deeplink': response.data.deeplink || null,
                'momoPaymentInfo.payUrl': response.data.payUrl || null
            });
            
            return {
                success: true,
                qrCodeUrl: response.data.qrCodeUrl,
                deeplink: response.data.deeplink || null,
                payUrl: response.data.payUrl || null
            };
        } else {
            return {
                success: false,
                message: response.data.message || 'Không thể tạo QR thanh toán Momo'
            };
        }
    } catch (error) {
        console.error('Momo payment error:', error);
        if (error.response && error.response.data) {
            console.error('Momo error details:', error.response.data);
        }
        return {
            success: false,
            message: 'Lỗi khi kết nối với Momo'
        };
    }
};

/**
 * Handle IPN (Instant Payment Notification) from Momo
 * @param {Object} ipnData - IPN data from Momo
 * @returns {Promise<Object>} - Result of IPN processing
 */
const handleIPN = async (ipnData) => {
    try {
        console.log('Received IPN data from Momo:', JSON.stringify(ipnData, null, 2));
        
        // Verify signature
        const receivedSignature = ipnData.signature;
        
        // Create raw signature for verification
        const rawSignature = `accessKey=${momoConfig.ACCESS_KEY}&amount=${ipnData.amount}&extraData=${ipnData.extraData}&message=${ipnData.message}&orderId=${ipnData.orderId}&orderInfo=${ipnData.orderInfo}&orderType=${ipnData.orderType}&partnerCode=${ipnData.partnerCode}&payType=${ipnData.payType}&requestId=${ipnData.requestId}&responseTime=${ipnData.responseTime}&resultCode=${ipnData.resultCode}&transId=${ipnData.transId}`;
        
        // Calculate signature
        const hmac = crypto.createHmac('sha256', momoConfig.SECRET_KEY);
        const calculatedSignature = hmac.update(Buffer.from(rawSignature, 'utf-8')).digest('hex');
        
        if (receivedSignature !== calculatedSignature) {
            console.error('IPN signature validation failed');
            console.log('Received signature:', receivedSignature);
            console.log('Calculated signature:', calculatedSignature);
            console.log('Raw signature string:', rawSignature);
            
            return {
                success: false,
                message: 'Invalid signature'
            };
        }
        
        // Find the order
        const orderId = ipnData.orderId;
        const order = await Order.findOne({
            'momoPaymentInfo.orderId': orderId
        });
        
        if (!order) {
            console.error('Order not found for IPN:', orderId);
            return {
                success: false,
                message: 'Order not found'
            };
        }
        
        // Check result code
        if (ipnData.resultCode === 0) {
            // Payment successful
            await Order.findByIdAndUpdate(order._id, {
                paymentStatus: 'Đã thanh toán',
                'momoPaymentInfo.transactionId': ipnData.transId,
                'momoPaymentInfo.paymentDate': new Date()
            });
            
            console.log('Payment successful for order:', order.orderId);
            
            return {
                success: true,
                message: 'Payment successful'
            };
        } else {
            // Payment failed
            console.error('Payment failed. Result code:', ipnData.resultCode);
            
            return {
                success: false,
                message: ipnData.message || 'Payment failed'
            };
        }
    } catch (error) {
        console.error('Momo IPN handling error:', error);
        return {
            success: false,
            message: 'Error processing payment notification'
        };
    }
};

/**
 * Verify payment status from Momo
 * @param {string} orderMomoId - Momo order ID
 * @returns {Promise<Object>} - Payment status
 */
const verifyPaymentStatus = async (orderMomoId) => {
    try {
        // This is a mockup, in production you'd use Momo's query API
        const order = await Order.findOne({
            'momoPaymentInfo.orderId': orderMomoId
        });
        
        if (!order) {
            return {
                success: false,
                message: 'Order not found'
            };
        }
        
        return {
            success: true,
            paymentStatus: order.paymentStatus,
            order: order
        };
    } catch (error) {
        console.error('Error verifying payment status:', error);
        return {
            success: false,
            message: 'Error checking payment status'
        };
    }
};

module.exports = {
    generateQRCode,
    handleIPN,
    verifyPaymentStatus
}; 