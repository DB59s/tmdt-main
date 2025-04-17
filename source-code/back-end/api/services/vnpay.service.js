const crypto = require('crypto');
const querystring = require('querystring');
const moment = require('moment');
const vnpayConfig = require('../../config/vnpay.config');
const Order = require('../models/order.model');

/**
 * Tạo signature cho VNPay
 * @param {Object} data - Dữ liệu cần tạo chữ ký
 * @param {string} secretKey - Secret key từ VNPay
 * @returns {string} - Chữ ký đã mã hóa
 */
const createSignature = (data, secretKey) => {
    const sortedParams = sortObject(data);
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
    return signed;
};

/**
 * Sắp xếp object theo key (VNPay yêu cầu)
 * @param {Object} obj - Object cần sắp xếp
 * @returns {Object} - Object đã sắp xếp
 */
const sortObject = (obj) => {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    
    for (let i = 0; i < keys.length; i++) {
        if (obj[keys[i]] !== '' && obj[keys[i]] !== null && obj[keys[i]] !== undefined) {
            sorted[keys[i]] = obj[keys[i]];
        }
    }
    
    return sorted;
};

/**
 * Tạo URL thanh toán VNPay
 * @param {Object} order - Thông tin đơn hàng
 * @param {string} ipAddress - IP của khách hàng
 * @returns {Promise<Object>} - URL thanh toán và mã tham chiếu
 */
const createPaymentUrl = async (order, ipAddress) => {
    try {
        // Tạo mã tham chiếu giao dịch
        const txnRef = `${moment().format('YYYYMMDDHHmmss')}_${order.orderId}`;
        const orderInfo = `Thanh toan don hang ${order.orderId}`;
        
        // Số tiền (nhân với 100 vì VNPay tính bằng tiền Việt nhân 100)
        const amount = order.totalAmount * 100;
        
        // Tạo dữ liệu gửi đến VNPay
        const vnpParams = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: vnpayConfig.vnp_TmnCode,
            vnp_Amount: amount,
            vnp_CreateDate: moment().format('YYYYMMDDHHmmss'),
            vnp_CurrCode: 'VND',
            vnp_IpAddr: ipAddress,
            vnp_Locale: 'vn',
            vnp_OrderInfo: orderInfo,
            vnp_ReturnUrl: vnpayConfig.vnp_ReturnUrl,
            vnp_TxnRef: txnRef,
            vnp_OrderType: 'other'
        };

        // Tạo chữ ký
        vnpParams.vnp_SecureHash = createSignature(vnpParams, vnpayConfig.vnp_HashSecret);
        
        // Tạo URL thanh toán
        const paymentUrl = `${vnpayConfig.vnp_Url}?${querystring.stringify(vnpParams)}`;
        
        // Cập nhật đơn hàng với thông tin VNPay
        await Order.findByIdAndUpdate(order._id, {
            paymentMethod: 'Thanh toán qua VNPay',
            paymentStatus: 'Chưa thanh toán',
            'vnpayPaymentInfo.vnpTxnRef': txnRef,
            'vnpayPaymentInfo.vnpOrderInfo': orderInfo,
            'vnpayPaymentInfo.vnpAmount': amount
        });
        
        return {
            success: true,
            paymentUrl: paymentUrl,
            txnRef: txnRef
        };
    } catch (error) {
        console.error('VNPay payment error:', error);
        return {
            success: false,
            message: 'Lỗi khi tạo URL thanh toán VNPay'
        };
    }
};

/**
 * Xử lý callback từ VNPay
 * @param {Object} vnpParams - Tham số trả về từ VNPay
 * @returns {Promise<Object>} - Kết quả xử lý
 */
const processReturnUrl = async (vnpParams) => {
    try {
        // Kiểm tra tính hợp lệ của dữ liệu
        const secureHash = vnpParams.vnp_SecureHash;
        delete vnpParams.vnp_SecureHash;
        delete vnpParams.vnp_SecureHashType;
        
        // Tính toán lại chữ ký để kiểm tra
        const calculatedHash = createSignature(vnpParams, vnpayConfig.vnp_HashSecret);
        
        if (secureHash !== calculatedHash) {
            return {
                success: false,
                message: 'Invalid signature'
            };
        }
        
        // Tìm đơn hàng dựa trên mã tham chiếu
        const order = await Order.findOne({
            'vnpayPaymentInfo.vnpTxnRef': vnpParams.vnp_TxnRef
        });
        
        if (!order) {
            return {
                success: false,
                message: 'Order not found',
                orderId: null
            };
        }
        
        // Kiểm tra mã phản hồi
        if (vnpParams.vnp_ResponseCode === '00') {
            // Thanh toán thành công
            await Order.findByIdAndUpdate(order._id, {
                paymentStatus: 'Đã thanh toán',
                'vnpayPaymentInfo.vnpTransactionNo': vnpParams.vnp_TransactionNo,
                'vnpayPaymentInfo.vnpResponseCode': vnpParams.vnp_ResponseCode,
                'vnpayPaymentInfo.vnpBankCode': vnpParams.vnp_BankCode,
                'vnpayPaymentInfo.vnpPayDate': vnpParams.vnp_PayDate,
                'vnpayPaymentInfo.vnpCardType': vnpParams.vnp_CardType,
                'vnpayPaymentInfo.vnpBankTranNo': vnpParams.vnp_BankTranNo,
                'vnpayPaymentInfo.paymentDate': new Date()
            });
            
            return {
                success: true,
                message: 'Payment successful',
                orderId: order.orderId
            };
        } else {
            // Thanh toán thất bại
            return {
                success: false,
                message: 'Payment failed',
                orderId: order.orderId,
                responseCode: vnpParams.vnp_ResponseCode
            };
        }
    } catch (error) {
        console.error('VNPay return processing error:', error);
        return {
            success: false,
            message: 'Error processing payment return'
        };
    }
};

/**
 * Kiểm tra trạng thái thanh toán của một đơn hàng
 * @param {string} txnRef - Mã tham chiếu giao dịch
 * @returns {Promise<Object>} - Kết quả kiểm tra
 */
const checkPaymentStatus = async (txnRef) => {
    try {
        const order = await Order.findOne({
            'vnpayPaymentInfo.vnpTxnRef': txnRef
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
        console.error('Error checking VNPay payment status:', error);
        return {
            success: false,
            message: 'Error checking payment status'
        };
    }
};

module.exports = {
    createPaymentUrl,
    processReturnUrl,
    checkPaymentStatus
}; 