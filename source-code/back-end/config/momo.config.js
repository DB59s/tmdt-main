module.exports = {
    MOMO_ENDPOINT: process.env.MOMO_ENDPOINT || 'https://payment.momo.vn/v2/gateway/api/create',
    PARTNER_CODE: process.env.MOMO_PARTNER_CODE || 'MOMOXZVG20250417',
    ACCESS_KEY: process.env.MOMO_ACCESS_KEY || 'T3eJ5KpHpP39aYv2',
    SECRET_KEY: process.env.MOMO_SECRET_KEY || 'JaheokPpzMQxLyuYRr9pHa2JsNQP5B1S',
    REDIRECT_URL: process.env.MOMO_REDIRECT_URL || 'http://yourdomain.com/payment/success',
    IPN_URL: process.env.MOMO_IPN_URL || 'http://yourdomain.com/api/customer/payment/momo/ipn',
    RETURN_URL: process.env.MOMO_RETURN_URL || 'http://yourdomain.com/payment/result'

    // PARTNER_CODE: process.env.MOMO_PARTNER_CODE || 'MOMO',
    // ACCESS_KEY: process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85',
    // SECRET_KEY: process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
    // REDIRECT_URL: process.env.MOMO_REDIRECT_URL || 'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b',
    // IPN_URL: process.env.MOMO_IPN_URL || 'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b',
    // RETURN_URL: process.env.MOMO_RETURN_URL || 'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b'
}; 