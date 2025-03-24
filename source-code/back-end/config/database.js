const mongoose = require('mongoose');
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: envFile });


const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL, {
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1); // Thoát ứng dụng nếu không thể kết nối
    }
};

module.exports = connectDB;
