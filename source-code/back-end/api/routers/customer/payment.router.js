const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/customer/payment.controller');

// Generate QR code for Momo payment
router.post('/momo/generate-qr', paymentController.generateMomoQR);

// Handle IPN (Instant Payment Notification) from Momo
router.post('/momo/ipn', paymentController.handleMomoIPN);

// Tạo URL thanh toán VNPay
router.post('/vnpay/create-payment', paymentController.createVnpayPayment);

// Xử lý callback từ VNPay
router.get('/vnpay/return', paymentController.handleVnpayReturn);

// Check payment status
router.get('/status/:orderId', paymentController.checkPaymentStatus);

// Create Solana payment URL
router.post('/solana/create-payment', paymentController.createSolanaPayment);

// Verify Solana payment
router.get('/solana/verify/:reference', paymentController.verifySolanaPayment);

// Handle webhook from Solana Pay
router.post('/solana/webhook', paymentController.handleSolanaWebhook);

// Create USDT payment info
router.post('/usdt/create-payment', paymentController.createUsdtPayment);

// Verify USDT payment
router.get('/usdt/verify/:reference', paymentController.verifyUsdtPayment);

// Manually confirm USDT payment
router.post('/usdt/confirm', paymentController.confirmUsdtPayment);

// Handle webhook from USDT payment provider
router.post('/usdt/webhook', paymentController.handleUsdtWebhook);

module.exports = router; 