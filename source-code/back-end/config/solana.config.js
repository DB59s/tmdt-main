const dotenv = require('dotenv');
const envPath = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envPath });

module.exports = {
    // Merchant wallet address that will receive payments
    MERCHANT_WALLET: process.env.SOLANA_MERCHANT_WALLET || '4j8Li5FRWtbTk7ovh7vuSXrJTKxkH1Gc9eA8boss3kEp', // Địa chỉ ví Solana mặc định cho môi trường dev (thay đổi thành địa chỉ ví của bạn khi sử dụng thực tế)
    
    // Solana network to use - 'devnet' for testing, 'mainnet-beta' for production
    NETWORK: process.env.SOLANA_NETWORK || 'devnet',
    
    // Store name that will appear in payment requests
    LABEL: process.env.SOLANA_LABEL || 'Duy-Khien',
    
    // URL to your store's logo
    ICON_URL: process.env.SOLANA_ICON_URL || 'https://yourstore.com/logo.png',
    
    // API for getting SOL price
    CURRENCY_API: process.env.SOLANA_CURRENCY_API || 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
    
    // Approximate USD to VND exchange rate (should be updated regularly)
    USD_TO_VND_RATE: process.env.SOLANA_USD_TO_VND_RATE || 24500,
};
