const crypto = require('crypto');
const axios = require('axios');
const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { encodeURL } = require('@solana/pay');
const BigNumber = require('bignumber.js');
const Order = require('../models/order.model');
const solanaConfig = require('../../config/solana.config');

/**
 * Get current SOL to USD exchange rate
 * @returns {Promise<number>} - Current SOL price in USD
 */
const getSolanaPrice = async () => {
    try {
        const response = await axios.get(solanaConfig.CURRENCY_API);
        return response.data.solana.usd;
    } catch (error) {
        console.error('Error fetching Solana price:', error);
        // Fallback to a default price if API fails
        return 150; // Example fallback price in USD
    }
};

/**
 * Convert VND amount to SOL
 * @param {number} vndAmount - Amount in VND
 * @returns {Promise<number>} - Equivalent amount in SOL
 */
const convertVndToSol = async (vndAmount) => {
    try {
        // Get current SOL price in USD
        const solPriceUsd = await getSolanaPrice();
        
        // Convert VND to USD
        const usdAmount = vndAmount / solanaConfig.USD_TO_VND_RATE;
        
        // Convert USD to SOL
        const solAmount = usdAmount / solPriceUsd;
        
        // Convert to BigNumber with 5 decimal places precision for Solana Pay
        return new BigNumber(solAmount.toFixed(5));
    } catch (error) {
        console.error('Error converting VND to SOL:', error);
        throw new Error('Không thể chuyển đổi tiền VND sang SOL');
    }
};

/**
 * Generate Solana Pay payment URL
 * @param {Object} order - Order details
 * @returns {Promise<Object>} - Solana payment data
 */
const generatePaymentUrl = async (order) => {
    try {
        // Convert VND amount to SOL
        const solAmount = await convertVndToSol(order.totalAmount);
        
        // Create a reference to identify the payment
        // Tạo reference từ buffer ngẫu nhiên và chuyển đổi thành base58
        const referenceBuffer = crypto.randomBytes(32);
        const reference = new PublicKey(referenceBuffer);
        
        // Create payment URL
        const url = encodeURL({
            recipient: new PublicKey(solanaConfig.MERCHANT_WALLET),
            amount: solAmount, // Đã là BigNumber
            reference: reference,
            label: solanaConfig.LABEL,
            message: `Thanh toán đơn hàng ${order.orderId}`,
            memo: order._id.toString(),
        });
        
        // Update order with Solana payment info
        await Order.findByIdAndUpdate(order._id, {
            paymentMethod: 'Thanh toán qua Solana',
            paymentStatus: 'Chưa thanh toán',
            'solanaPaymentInfo.reference': reference.toString(),
            'solanaPaymentInfo.amount': solAmount.toString(), // Chuyển BigNumber thành string để lưu vào DB
            'solanaPaymentInfo.amountInVnd': order.totalAmount,
            'solanaPaymentInfo.paymentUrl': url.toString(),
            'solanaPaymentInfo.createdAt': new Date()
        });
        
        return {
            success: true,
            paymentUrl: url.toString(),
            amount: solAmount,
            amountInVnd: order.totalAmount,
            reference: reference.toString(),
            orderId: order.orderId
        };
    } catch (error) {
        console.error('Solana payment error:', error);
        return {
            success: false,
            message: error.message || 'Lỗi khi tạo thanh toán Solana'
        };
    }
};

/**
 * Verify Solana payment status
 * @param {string} reference - Payment reference
 * @returns {Promise<Object>} - Payment verification result
 */
const verifyPayment = async (reference) => {
    try {
        // Find the order with this reference
        const order = await Order.findOne({
            'solanaPaymentInfo.reference': reference
        });
        
        if (!order) {
            return {
                success: false,
                message: 'Không tìm thấy đơn hàng'
            };
        }
        
        // Connect to Solana network
        const connection = new Connection(
            solanaConfig.NETWORK === 'mainnet-beta' 
                ? 'https://api.mainnet-beta.solana.com' 
                : 'https://api.devnet.solana.com'
        );
        
        // Convert reference string back to PublicKey
        const referencePublicKey = new PublicKey(reference);
        
        // Get all signatures for the reference
        const signatures = await connection.getSignaturesForAddress(referencePublicKey);
        
        if (signatures.length === 0) {
            return {
                success: false,
                verified: false,
                message: 'Chưa tìm thấy giao dịch thanh toán'
            };
        }
        
        // Get the most recent transaction
        const transaction = await connection.getTransaction(signatures[0].signature);
        
        if (!transaction) {
            return {
                success: false,
                verified: false,
                message: 'Không thể xác minh giao dịch'
            };
        }
        
        // Update order payment status
        await Order.findByIdAndUpdate(order._id, {
            paymentStatus: 'Đã thanh toán',
            'solanaPaymentInfo.transactionId': signatures[0].signature,
            'solanaPaymentInfo.paymentDate': new Date(),
            'solanaPaymentInfo.verified': true
        });
        
        return {
            success: true,
            verified: true,
            message: 'Thanh toán đã được xác nhận',
            transactionId: signatures[0].signature,
            order: order.orderId
        };
    } catch (error) {
        console.error('Error verifying Solana payment:', error);
        return {
            success: false,
            verified: false,
            message: 'Lỗi khi xác minh thanh toán'
        };
    }
};

/**
 * Handle webhook from Solana Pay
 * @param {Object} webhookData - Webhook data
 * @returns {Promise<Object>} - Result of webhook processing
 */
const handleWebhook = async (webhookData) => {
    try {
        console.log('Received webhook from Solana Pay:', JSON.stringify(webhookData, null, 2));
        
        // Extract reference from webhook data
        const { reference, signature } = webhookData;
        
        if (!reference) {
            return {
                success: false,
                message: 'Missing reference in webhook data'
            };
        }
        
        // Verify the payment
        return await verifyPayment(reference);
    } catch (error) {
        console.error('Solana webhook handling error:', error);
        return {
            success: false,
            message: 'Error processing payment notification'
        };
    }
};

module.exports = {
    generatePaymentUrl,
    verifyPayment,
    handleWebhook,
    convertVndToSol
};
