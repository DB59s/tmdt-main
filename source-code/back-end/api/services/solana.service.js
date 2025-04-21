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
    console.log('Fetching Solana price...');
    console.log(solanaConfig.MERCHANT_WALLET);
    console.log(solanaConfig.USD_TO_VND_RATE);
    console.log(solanaConfig.LABEL);
    console.log(solanaConfig.NETWORK);
    
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
        console.log(`[Solana] Verifying payment for reference: ${reference}`);
        console.log(`[Solana] Network: ${solanaConfig.NETWORK}`);
        console.log(`[Solana] Merchant wallet: ${solanaConfig.MERCHANT_WALLET}`);
        
        // Find the order with this reference
        const order = await Order.findOne({
            'solanaPaymentInfo.reference': reference
        });
        
        if (!order) {
            console.log(`[Solana] Order not found for reference: ${reference}`);
            return {
                success: false,
                message: 'Không tìm thấy đơn hàng'
            };
        }
        
        console.log(`[Solana] Found order: ${order.orderId} with payment status: ${order.paymentStatus}`);
        
        // Connect to Solana network
        const connection = new Connection(
            solanaConfig.NETWORK === 'mainnet-beta' 
                ? 'https://api.mainnet-beta.solana.com' 
                : 'https://api.devnet.solana.com'
        );
        
        console.log(`[Solana] Connected to ${solanaConfig.NETWORK === 'mainnet-beta' ? 'mainnet' : 'devnet'}`);
        
        // Convert reference string back to PublicKey
        const referencePublicKey = new PublicKey(reference);
        console.log(`[Solana] Reference public key: ${referencePublicKey.toString()}`);
        
        // Get all signatures for the reference
        console.log(`[Solana] Getting signatures for address: ${referencePublicKey.toString()}`);
        const signatures = await connection.getSignaturesForAddress(referencePublicKey);
        console.log(`[Solana] Found ${signatures.length} signatures`);
        
        if (signatures.length === 0) {
            console.log(`[Solana] No transactions found for reference: ${reference}`);
            return {
                success: false,
                verified: false,
                message: 'Chưa tìm thấy giao dịch thanh toán',
                order: order.orderId
            };
        }
        
        // Log all signatures found
        signatures.forEach((sig, index) => {
            console.log(`[Solana] Signature ${index + 1}: ${sig.signature}`);
        });
        
        // Get the most recent transaction
        console.log(`[Solana] Getting transaction details for signature: ${signatures[0].signature}`);
        const transaction = await connection.getTransaction(signatures[0].signature);
        
        if (!transaction) {
            console.log(`[Solana] Transaction details not found for signature: ${signatures[0].signature}`);
            return {
                success: false,
                verified: false,
                message: 'Không thể xác minh giao dịch',
                order: order.orderId
            };
        }
        
        console.log(`[Solana] Transaction found with ${transaction.transaction.message.accountKeys.length} accounts`);
        
        // Verify the transaction is valid and contains payment to merchant wallet
        const merchantWallet = new PublicKey(solanaConfig.MERCHANT_WALLET);
        console.log(`[Solana] Merchant wallet: ${merchantWallet.toString()}`);
        
        let isValidPayment = false;
        
        // Check if transaction contains a transfer to the merchant wallet
        if (transaction && transaction.meta && transaction.meta.postTokenBalances) {
            console.log(`[Solana] Checking token transfers in transaction`);
            console.log(`[Solana] Post token balances:`, JSON.stringify(transaction.meta.postTokenBalances));
            
            // Check for token transfers
            isValidPayment = transaction.meta.postTokenBalances.some(balance => {
                const isMatch = balance.owner === merchantWallet.toString();
                if (isMatch) {
                    console.log(`[Solana] Found token transfer to merchant wallet`);
                }
                return isMatch;
            });
        }
        
        // If no token transfers, check for SOL transfers
        if (!isValidPayment && transaction.meta && transaction.meta.postBalances) {
            console.log(`[Solana] Checking SOL transfers in transaction`);
            
            const accountKeys = transaction.transaction.message.accountKeys;
            console.log(`[Solana] Account keys in transaction:`, accountKeys.map(key => key.toString()));
            
            console.log(`[Solana] Searching for merchant wallet in transaction accounts`);
            const merchantIndex = accountKeys.findIndex(key => {
                const isMatch = key.toString() === merchantWallet.toString();
                return isMatch;
            });
            
            if (merchantIndex >= 0) {
                console.log(`[Solana] Found merchant wallet in transaction accounts at index ${merchantIndex}`);
            }
            
            if (merchantIndex >= 0) {
                const preBalance = transaction.meta.preBalances[merchantIndex];
                const postBalance = transaction.meta.postBalances[merchantIndex];
                
                console.log(`[Solana] Merchant wallet balance before: ${preBalance / LAMPORTS_PER_SOL} SOL`);
                console.log(`[Solana] Merchant wallet balance after: ${postBalance / LAMPORTS_PER_SOL} SOL`);
                
                isValidPayment = postBalance > preBalance;
                
                if (isValidPayment) {
                    console.log(`[Solana] Valid payment confirmed: Balance increased by ${(postBalance - preBalance) / LAMPORTS_PER_SOL} SOL`);
                } else {
                    console.log(`[Solana] Invalid payment: Balance did not increase`);
                }
            } else {
                console.log(`[Solana] Merchant wallet not found in transaction accounts`);
            }
        }
        
        if (!isValidPayment) {
            console.log(`[Solana] Payment validation failed for order: ${order.orderId}`);
            return {
                success: false,
                verified: false,
                message: 'Giao dịch không hợp lệ hoặc không phải thanh toán đến ví merchant',
                order: order.orderId
            };
        }
        
        // Update order payment status
        console.log(`[Solana] Updating order ${order.orderId} to 'Đã thanh toán'`);
        await Order.findByIdAndUpdate(order._id, {
            paymentStatus: 'Đã thanh toán',
            'solanaPaymentInfo.transactionId': signatures[0].signature,
            'solanaPaymentInfo.paymentDate': new Date(),
            'solanaPaymentInfo.verified': true
        });
        
        console.log(`[Solana] Payment verified successfully for order: ${order.orderId}`);
        return {
            success: true,
            verified: true,
            message: 'Thanh toán đã được xác nhận',
            transactionId: signatures[0].signature,
            order: order.orderId
        };
    } catch (error) {
        console.error('[Solana] Error verifying payment:', error);
        return {
            success: false,
            verified: false,
            message: 'Lỗi khi xác minh thanh toán: ' + error.message
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
        const { reference, signature, status } = webhookData;
        
        if (!reference) {
            return {
                success: false,
                message: 'Missing reference in webhook data'
            };
        }
        
        // Find the order with this reference
        const order = await Order.findOne({
            'solanaPaymentInfo.reference': reference
        });
        
        if (!order) {
            return {
                success: false,
                message: 'Không tìm thấy đơn hàng với mã tham chiếu này'
            };
        }
        
        // If webhook includes a status and it's 'confirmed' or 'finalized', mark as paid immediately
        if (status && ['confirmed', 'finalized'].includes(status.toLowerCase())) {
            await Order.findByIdAndUpdate(order._id, {
                paymentStatus: 'Đã thanh toán',
                'solanaPaymentInfo.transactionId': signature || 'webhook-confirmed',
                'solanaPaymentInfo.paymentDate': new Date(),
                'solanaPaymentInfo.verified': true
            });
            
            return {
                success: true,
                verified: true,
                message: 'Thanh toán đã được xác nhận qua webhook',
                transactionId: signature || 'webhook-confirmed',
                order: order.orderId
            };
        }
        
        // If no status or not confirmed, verify the payment on-chain
        return await verifyPayment(reference);
    } catch (error) {
        console.error('Solana webhook handling error:', error);
        return {
            success: false,
            message: 'Lỗi khi xử lý thông báo thanh toán: ' + error.message
        };
    }
};

/**
 * Check payment status periodically
 * @param {string} reference - Payment reference
 * @param {number} maxAttempts - Maximum number of verification attempts
 * @param {number} intervalMs - Interval between attempts in milliseconds
 * @returns {Promise<Object>} - Final verification result
 */
const pollPaymentStatus = async (reference, maxAttempts = 10, intervalMs = 3000) => {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        const result = await verifyPayment(reference);
        
        if (result.verified) {
            return result;
        }
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        attempts++;
    }
    
    return {
        success: false,
        verified: false,
        message: 'Hết thời gian chờ xác minh thanh toán'
    };
};

module.exports = {
    generatePaymentUrl,
    verifyPayment,
    handleWebhook,
    convertVndToSol,
    pollPaymentStatus
};
