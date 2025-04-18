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
        console.log('========== MOMO IPN PROCESSING START ==========');
        console.log('Received IPN data from Momo:', JSON.stringify(ipnData, null, 2));
        console.log('IPN received at:', new Date().toISOString());
        console.log('IPN endpoint config:', momoConfig.IPN_URL);
        
        // Verify signature
        console.log('Starting signature verification...');
        const receivedSignature = ipnData.signature;
        console.log('Received signature:', receivedSignature);
        
        // Create raw signature for verification
        const rawSignature = `accessKey=${momoConfig.ACCESS_KEY}&amount=${ipnData.amount}&extraData=${ipnData.extraData}&message=${ipnData.message}&orderId=${ipnData.orderId}&orderInfo=${ipnData.orderInfo}&orderType=${ipnData.orderType}&partnerCode=${ipnData.partnerCode}&payType=${ipnData.payType}&requestId=${ipnData.requestId}&responseTime=${ipnData.responseTime}&resultCode=${ipnData.resultCode}&transId=${ipnData.transId}`;
        console.log('Raw signature string:', rawSignature);
        
        // Calculate signature
        console.log('Calculating signature with SECRET_KEY:', momoConfig.SECRET_KEY.substring(0, 3) + '...' + momoConfig.SECRET_KEY.substring(momoConfig.SECRET_KEY.length - 3));
        const hmac = crypto.createHmac('sha256', momoConfig.SECRET_KEY);
        const calculatedSignature = hmac.update(Buffer.from(rawSignature, 'utf-8')).digest('hex');
        console.log('Calculated signature:', calculatedSignature);
        console.log('Signatures match?', receivedSignature === calculatedSignature);
        
        if (receivedSignature !== calculatedSignature) {
            console.error('❌ IPN signature validation failed');
            console.log('Received signature:', receivedSignature);
            console.log('Calculated signature:', calculatedSignature);
            console.log('Raw signature string:', rawSignature);
            console.log('========== MOMO IPN PROCESSING END (SIGNATURE FAILED) ==========');
            
            return {
                success: false,
                message: 'Invalid signature'
            };
        }
        
        console.log('✅ Signature verification successful');
        
        // Find the order
        console.log('Finding order with Momo orderId:', ipnData.orderId);
        const orderId = ipnData.orderId;
        const order = await Order.findOne({
            'momoPaymentInfo.orderId': orderId
        });
        
        console.log('Order found?', !!order);
        if (order) {
            console.log('Order details:', {
                orderId: order.orderId,
                _id: order._id.toString(),
                currentPaymentStatus: order.paymentStatus,
                totalAmount: order.totalAmount,
                momoInfo: order.momoPaymentInfo || 'Not available'
            });
        }
        
        if (!order) {
            console.error('❌ Order not found for IPN:', orderId);
            console.log('========== MOMO IPN PROCESSING END (ORDER NOT FOUND) ==========');
            return {
                success: false,
                message: 'Order not found'
            };
        }
        
        // Check result code
        console.log('Checking result code:', ipnData.resultCode);
        if (ipnData.resultCode === 0) {
            // Payment successful
            console.log('✅ Result code indicates successful payment');
            console.log('Updating order payment status to: Đã thanh toán');
            console.log('Transaction ID from Momo:', ipnData.transId);
            
            const updateResult = await Order.findByIdAndUpdate(order._id, {
                paymentStatus: 'Đã thanh toán',
                'momoPaymentInfo.transactionId': ipnData.transId,
                'momoPaymentInfo.paymentDate': new Date()
            }, { new: true });
            
            console.log('Order update result:', {
                updated: !!updateResult,
                newPaymentStatus: updateResult ? updateResult.paymentStatus : 'Update failed',
                updatedAt: new Date().toISOString()
            });
            
            console.log('✅ Payment successful for order:', order.orderId);
            console.log('========== MOMO IPN PROCESSING END (SUCCESS) ==========');
            
            return {
                success: true,
                message: 'Payment successful'
            };
        } else {
            // Payment failed
            console.error(`❌ Payment failed. Result code: ${ipnData.resultCode}, Message: ${ipnData.message || 'No message provided'}`);
            console.log('========== MOMO IPN PROCESSING END (PAYMENT FAILED) ==========');
            
            return {
                success: false,
                message: ipnData.message || 'Payment failed'
            };
        }
    } catch (error) {
        console.error('❌ Momo IPN handling error:', error);
        console.error('Error stack:', error.stack);
        console.log('========== MOMO IPN PROCESSING END (ERROR) ==========');
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

/**
 * Chủ động kiểm tra trạng thái thanh toán từ Momo API
 * @param {string} orderId - Mã đơn hàng Momo
 * @returns {Promise<Object>} - Kết quả kiểm tra
 */
const checkPaymentStatus = async (orderId) => {
    try {
        console.log('========== CHECKING MOMO PAYMENT STATUS ==========');
        console.log('Checking payment status for Momo orderId:', orderId);
        
        // Tìm đơn hàng trong database
        const order = await Order.findOne({
            'momoPaymentInfo.orderId': orderId
        });
        
        if (!order) {
            console.error('❌ Order not found with Momo orderId:', orderId);
            return {
                success: false,
                message: 'Không tìm thấy đơn hàng'
            };
        }
        
        console.log('Order found:', {
            orderId: order.orderId,
            _id: order._id.toString(),
            currentPaymentStatus: order.paymentStatus,
            momoInfo: order.momoPaymentInfo || 'Not available'
        });
        
        // Nếu đã thanh toán rồi thì trả về luôn
        if (order.paymentStatus === 'Đã thanh toán') {
            console.log('✅ Order already marked as paid');
            return {
                success: true,
                message: 'Đơn hàng đã được thanh toán',
                order: order
            };
        }
        
        // Chuẩn bị dữ liệu để gọi API kiểm tra trạng thái
        const requestData = {
            partnerCode: momoConfig.PARTNER_CODE,
            accessKey: momoConfig.ACCESS_KEY,
            requestId: Date.now().toString(),
            orderId: orderId,
            lang: 'vi'
        };
        
        // Tạo chữ ký
        const rawSignature = `accessKey=${requestData.accessKey}&orderId=${requestData.orderId}&partnerCode=${requestData.partnerCode}&requestId=${requestData.requestId}`;
        const hmac = crypto.createHmac('sha256', momoConfig.SECRET_KEY);
        requestData.signature = hmac.update(Buffer.from(rawSignature, 'utf-8')).digest('hex');
        
        console.log('Sending query to Momo API:', JSON.stringify(requestData, null, 2));
        
        // Gọi API Momo để kiểm tra trạng thái
        // Lưu ý: Trong môi trường thực tế, bạn cần sử dụng endpoint chính xác của Momo
        // Đây là một ví dụ, endpoint thực tế có thể khác
        const queryEndpoint = 'https://payment.momo.vn/v2/gateway/api/query';
        const response = await axios.post(queryEndpoint, requestData);
        
        console.log('Momo query response:', JSON.stringify(response.data, null, 2));
        
        // Kiểm tra kết quả từ Momo
        if (response.data.resultCode === 0 && response.data.transId) {
            // Thanh toán thành công, cập nhật trạng thái đơn hàng
            console.log('✅ Payment confirmed successful by Momo API');
            console.log('Updating order payment status to: Đã thanh toán');
            
            const updateResult = await Order.findByIdAndUpdate(order._id, {
                paymentStatus: 'Đã thanh toán',
                'momoPaymentInfo.transactionId': response.data.transId,
                'momoPaymentInfo.paymentDate': new Date()
            }, { new: true });
            
            console.log('Order update result:', {
                updated: !!updateResult,
                newPaymentStatus: updateResult ? updateResult.paymentStatus : 'Update failed',
                updatedAt: new Date().toISOString()
            });
            
            return {
                success: true,
                message: 'Thanh toán thành công',
                order: updateResult
            };
        } else if (response.data.resultCode === 1006) {
            // Giao dịch đang xử lý
            console.log('⏳ Payment is being processed');
            return {
                success: true,
                message: 'Giao dịch đang được xử lý',
                isPending: true
            };
        } else {
            // Thanh toán thất bại hoặc bị hủy
            console.error(`❌ Payment failed or cancelled. Result code: ${response.data.resultCode}`);
            return {
                success: false,
                message: response.data.message || 'Thanh toán thất bại hoặc bị hủy'
            };
        }
    } catch (error) {
        console.error('❌ Error checking Momo payment status:', error);
        if (error.response) {
            console.error('Momo API error response:', error.response.data);
        }
        console.error('Error stack:', error.stack);
        return {
            success: false,
            message: 'Lỗi khi kiểm tra trạng thái thanh toán'
        };
    } finally {
        console.log('========== MOMO PAYMENT STATUS CHECK COMPLETED ==========');
    }
};

module.exports = {
    generateQRCode,
    handleIPN,
    verifyPaymentStatus,
    checkPaymentStatus
}; 