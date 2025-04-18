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
}; 