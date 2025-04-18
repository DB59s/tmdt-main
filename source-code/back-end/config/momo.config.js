const dotenv = require('dotenv');
const envPath = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envPath });

module.exports = {
    MOMO_ENDPOINT: process.env.MOMO_ENDPOINT ,
    PARTNER_CODE: process.env.MOMO_PARTNER_CODE ,
    ACCESS_KEY: process.env.MOMO_ACCESS_KEY ,
    SECRET_KEY: process.env.MOMO_SECRET_KEY ,
    REDIRECT_URL: process.env.MOMO_REDIRECT_URL ,
    IPN_URL: process.env.MOMO_IPN_URL ,
    RETURN_URL: process.env.MOMO_RETURN_URL

    // PARTNER_CODE: process.env.MOMO_PARTNER_CODE || 'MOMO',
    // ACCESS_KEY: process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85',
    // SECRET_KEY: process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
    // REDIRECT_URL: process.env.MOMO_REDIRECT_URL || 'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b',
    // IPN_URL: process.env.MOMO_IPN_URL || 'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b',
    // RETURN_URL: process.env.MOMO_RETURN_URL || 'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b'
}; 