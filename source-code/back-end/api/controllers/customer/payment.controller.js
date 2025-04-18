const Order = require('../../models/order.model');
const momoService = require('../../services/momo.service');
const vnpayService = require('../../services/vnpay.service');
const solanaService = require('../../services/solana.service');
const usdtService = require('../../services/usdt.service');

/**
 * Generate Momo QR payment for an order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with QR code data
 */
const generateMomoQR = async (req, res) => {
    try {
        const { orderId } = req.body;
        
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Mã đơn hàng không được cung cấp'
            });
        }
        
        // Find the order
        const order = await Order.findOne({ orderId });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }
        
        // Check if already paid
        if (order.paymentStatus === 'Đã thanh toán') {
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng này đã được thanh toán'
            });
        }
        
        // Update order payment method
        await Order.findByIdAndUpdate(order._id, {
            paymentMethod: 'Thanh toán qua Momo',
            paymentStatus: 'Chưa thanh toán'
        });
        
        // Generate QR code
        const qrResult = await momoService.generateQRCode(order);
        
        if (!qrResult.success) {
            return res.status(500).json({
                success: false,
                message: qrResult.message
            });
        }
        
        return res.status(200).json({
            success: true,
            data: {
                qrCodeUrl: qrResult.qrCodeUrl,
                deeplink: qrResult.deeplink,
                payUrl: qrResult.payUrl,
                amount: order.totalAmount,
                orderId: order.orderId
            }
        });
    } catch (error) {
        console.error('Error generating Momo QR:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo QR thanh toán'
        });
    }
};

/**
 * Handle IPN from Momo payment gateway
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response for Momo
 */
const handleMomoIPN = async (req, res) => {
    try {
        const ipnData = req.body;
        
        // Handle IPN notification
        const result = await momoService.handleIPN(ipnData);
        
        // Return response to Momo
        return res.status(200).json({
            status: result.success ? 'success' : 'error',
            message: result.message
        });
    } catch (error) {
        console.error('Momo IPN error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

/**
 * Tạo URL thanh toán VNPay cho đơn hàng
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - URL thanh toán VNPay
 */
const createVnpayPayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Mã đơn hàng không được cung cấp'
            });
        }
        
        // Tìm đơn hàng
        const order = await Order.findOne({ orderId });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }
        
        // Kiểm tra nếu đã thanh toán
        if (order.paymentStatus === 'Đã thanh toán') {
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng này đã được thanh toán'
            });
        }
        
        // Lấy IP của người dùng
        const ipAddr = req.headers['x-forwarded-for'] || 
                      req.connection.remoteAddress || 
                      req.socket.remoteAddress || 
                      req.connection.socket.remoteAddress;
        
        // Tạo URL thanh toán
        const paymentResult = await vnpayService.createPaymentUrl(order, ipAddr);
        
        if (!paymentResult.success) {
            return res.status(500).json({
                success: false,
                message: paymentResult.message
            });
        }
        
        return res.status(200).json({
            success: true,
            data: {
                paymentUrl: paymentResult.paymentUrl,
                txnRef: paymentResult.txnRef,
                amount: order.totalAmount,
                orderId: order.orderId
            }
        });
    } catch (error) {
        console.error('Error creating VNPay payment:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo URL thanh toán VNPay'
        });
    }
};

/**
 * Xử lý kết quả thanh toán từ VNPay
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Kết quả thanh toán
 */
const handleVnpayReturn = async (req, res) => {
    try {
        // Xử lý callback từ VNPay
        const result = await vnpayService.processReturnUrl(req.query);
        
        // Redirect về trang kết quả thanh toán với thông tin thích hợp
        if (result.success) {
            // Thanh toán thành công
            return res.redirect(`/payment/result?status=success&orderId=${result.orderId}`);
        } else {
            // Thanh toán thất bại
            return res.redirect(`/payment/result?status=failed&orderId=${result.orderId || ''}&message=${result.message}`);
        }
    } catch (error) {
        console.error('VNPay return error:', error);
        return res.redirect('/payment/result?status=error&message=Lỗi xử lý thanh toán');
    }
};

/**
 * Check payment status for an order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with payment status
 */
const checkPaymentStatus = async (req, res) => {
    try {
        const { orderId, paymentMethod } = req.params;
        
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Mã đơn hàng không được cung cấp'
            });
        }
        
        // Find the order
        const order = await Order.findOne({ orderId });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        // Nếu đã thanh toán rồi, trả về trạng thái hiện tại
        if (order.paymentStatus === 'Đã thanh toán') {
            return res.status(200).json({
                success: true,
                data: {
                    paymentStatus: order.paymentStatus,
                    paymentMethod: order.paymentMethod,
                    amount: order.totalAmount,
                    orderId: order.orderId
                }
            });
        }
        
        // Kiểm tra theo phương thức thanh toán
        if (order.paymentMethod === 'Thanh toán qua Momo') {
            // Nếu thanh toán qua Momo và chưa hoàn thành, chủ động kiểm tra với Momo API
            console.log('Chủ động kiểm tra trạng thái thanh toán Momo cho đơn hàng:', orderId);
            
            if (order.momoPaymentInfo && order.momoPaymentInfo.orderId) {
                const momoResult = await momoService.checkPaymentStatus(order.momoPaymentInfo.orderId);
                
                if (momoResult.success) {
                    // Nếu đã cập nhật thành công từ Momo API
                    return res.status(200).json({
                        success: true,
                        message: momoResult.message,
                        data: {
                            paymentStatus: momoResult.order ? momoResult.order.paymentStatus : order.paymentStatus,
                            paymentMethod: order.paymentMethod,
                            amount: order.totalAmount,
                            orderId: order.orderId,
                            isPending: momoResult.isPending || false
                        }
                    });
                }
            }
        }
        
        // Trả về trạng thái hiện tại nếu không có cập nhật từ các API thanh toán
        return res.status(200).json({
            success: true,
            data: {
                paymentStatus: order.paymentStatus,
                paymentMethod: order.paymentMethod,
                amount: order.totalAmount,
                orderId: order.orderId
            }
        });
    } catch (error) {
        console.error('Error checking payment status:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra trạng thái thanh toán'
        });
    }
};

/**
 * Create Solana Pay payment URL for an order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with payment URL
 */
const createSolanaPayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Mã đơn hàng không được cung cấp'
            });
        }
        
        // Find the order
        const order = await Order.findOne({ orderId });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }
        
        // Check if already paid
        if (order.paymentStatus === 'Đã thanh toán') {
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng này đã được thanh toán'
            });
        }
        
        // Generate Solana payment URL
        const paymentResult = await solanaService.generatePaymentUrl(order);
        
        if (!paymentResult.success) {
            return res.status(500).json({
                success: false,
                message: paymentResult.message
            });
        }
        
        return res.status(200).json({
            success: true,
            data: {
                paymentUrl: paymentResult.paymentUrl,
                amount: paymentResult.amount,
                amountInVnd: paymentResult.amountInVnd,
                reference: paymentResult.reference,
                orderId: order.orderId
            }
        });
    } catch (error) {
        console.error('Error creating Solana payment:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo thanh toán Solana'
        });
    }
};

/**
 * Verify Solana payment status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with verification result
 */
const verifySolanaPayment = async (req, res) => {
    try {
        const { reference } = req.params;
        
        if (!reference) {
            return res.status(400).json({
                success: false,
                message: 'Mã tham chiếu không được cung cấp'
            });
        }
        
        // Verify the payment
        const verificationResult = await solanaService.verifyPayment(reference);
        
        return res.status(200).json({
            success: verificationResult.success,
            verified: verificationResult.verified || false,
            message: verificationResult.message,
            data: verificationResult.success ? {
                transactionId: verificationResult.transactionId,
                orderId: verificationResult.order
            } : null
        });
    } catch (error) {
        console.error('Error verifying Solana payment:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi xác minh thanh toán Solana'
        });
    }
};

/**
 * Handle webhook from Solana Pay
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response for Solana Pay
 */
const handleSolanaWebhook = async (req, res) => {
    try {
        const webhookData = req.body;
        
        // Handle webhook notification
        const result = await solanaService.handleWebhook(webhookData);
        
        // Return response
        return res.status(200).json({
            status: result.success ? 'success' : 'error',
            message: result.message
        });
    } catch (error) {
        console.error('Solana webhook error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

/**
 * Create USDT payment info for an order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with payment info
 */
const createUsdtPayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Mã đơn hàng không được cung cấp'
            });
        }
        
        // Find the order
        const order = await Order.findOne({ orderId });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }
        
        // Check if already paid
        if (order.paymentStatus === 'Đã thanh toán') {
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng này đã được thanh toán'
            });
        }
        
        // Generate USDT payment info
        const paymentResult = await usdtService.generatePaymentInfo(order);
        
        if (!paymentResult.success) {
            return res.status(500).json({
                success: false,
                message: paymentResult.message
            });
        }
        
        return res.status(200).json({
            success: true,
            data: {
                walletAddress: paymentResult.walletAddress,
                amount: paymentResult.amount,
                amountInVnd: paymentResult.amountInVnd,
                reference: paymentResult.reference,
                network: paymentResult.network,
                orderId: order.orderId
            }
        });
    } catch (error) {
        console.error('Error creating USDT payment:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo thanh toán USDT'
        });
    }
};

/**
 * Verify USDT payment status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with verification result
 */
const verifyUsdtPayment = async (req, res) => {
    try {
        const { reference } = req.params;
        
        if (!reference) {
            return res.status(400).json({
                success: false,
                message: 'Mã tham chiếu không được cung cấp'
            });
        }
        
        // Verify the payment
        const verificationResult = await usdtService.verifyPayment(reference);
        
        return res.status(200).json({
            success: verificationResult.success,
            verified: verificationResult.verified || false,
            message: verificationResult.message,
            data: verificationResult.success ? {
                transactionId: verificationResult.transactionId,
                orderId: verificationResult.order
            } : null
        });
    } catch (error) {
        console.error('Error verifying USDT payment:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi xác minh thanh toán USDT'
        });
    }
};

/**
 * Manually confirm USDT payment with transaction ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with confirmation result
 */
const confirmUsdtPayment = async (req, res) => {
    try {
        const { reference, transactionId } = req.body;
        
        if (!reference || !transactionId) {
            return res.status(400).json({
                success: false,
                message: 'Mã tham chiếu và mã giao dịch không được cung cấp đầy đủ'
            });
        }
        
        // Confirm the payment
        const confirmationResult = await usdtService.confirmPayment(reference, transactionId);
        
        return res.status(200).json({
            success: confirmationResult.success,
            message: confirmationResult.message,
            data: confirmationResult.success ? {
                orderId: confirmationResult.orderId
            } : null
        });
    } catch (error) {
        console.error('Error confirming USDT payment:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi xác nhận thanh toán USDT'
        });
    }
};

/**
 * Handle webhook from USDT payment provider
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response for payment provider
 */
const handleUsdtWebhook = async (req, res) => {
    try {
        const webhookData = req.body;
        
        // Handle webhook notification
        const result = await usdtService.handleWebhook(webhookData);
        
        // Return response
        return res.status(200).json({
            status: result.success ? 'success' : 'error',
            message: result.message
        });
    } catch (error) {
        console.error('USDT webhook error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

module.exports = {
    generateMomoQR,
    handleMomoIPN,
    createVnpayPayment,
    handleVnpayReturn,
    checkPaymentStatus,
    createSolanaPayment,
    verifySolanaPayment,
    handleSolanaWebhook,
    createUsdtPayment,
    verifyUsdtPayment,
    confirmUsdtPayment,
    handleUsdtWebhook
};