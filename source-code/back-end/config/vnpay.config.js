module.exports = {
    vnp_TmnCode: process.env.VNPAY_TMN_CODE || 'VNPAYXXX',
    vnp_HashSecret: process.env.VNPAY_HASH_SECRET || 'VNPAYSECRETXXX',
    vnp_Url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    vnp_Api: process.env.VNPAY_API || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
    vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || 'http://yourdomain.com/api/customer/payment/vnpay/return'
}; 