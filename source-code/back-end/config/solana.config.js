/**
 * Solana Pay configuration
 */
module.exports = {
    // Merchant wallet address that will receive payments
    MERCHANT_WALLET: process.env.SOLANA_MERCHANT_WALLET || '5YNmS1R9nNSCDzb5a7mMJ1dwK9uHeAAQmNTe5izzKKdn', // Địa chỉ ví Solana mặc định cho môi trường dev (thay đổi thành địa chỉ ví của bạn khi sử dụng thực tế)
    
    // Solana network to use - 'devnet' for testing, 'mainnet-beta' for production
    NETWORK: process.env.SOLANA_NETWORK || 'devnet',
    
    // Store name that will appear in payment requests
    LABEL: process.env.SOLANA_LABEL || 'Your Store Name',
    
    // URL to your store's logo
    ICON_URL: process.env.SOLANA_ICON_URL || 'https://yourstore.com/logo.png',
    
    // API for getting SOL price
    CURRENCY_API: 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
    
    // Approximate USD to VND exchange rate (should be updated regularly)
    USD_TO_VND_RATE: 24500,
};
