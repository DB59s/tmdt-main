const connectDB = require('./config/database');
const express = require('express');
const cors = require('cors');
const app = express();
const router = require('./api/routers/index');
const path = require('path');

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: envFile });

const port = process.env.PORT || 8080;

// Cấu hình CORS
const corsOptions = {
    origin: '*', // Cho phép tất cả các domain
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Cho phép tất cả các methods
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'], // Cho phép các headers
    credentials: true, // Cho phép gửi cookies
    optionsSuccessStatus: 200 // Một số trình duyệt chỉ chấp nhận status 200
};

// Áp dụng CORS cho tất cả các routes
app.use(cors(corsOptions));

// Middleware để xử lý preflight requests
app.options('*', cors(corsOptions));

// Middleware để xử lý JSON và tăng giới hạn kích thước request body
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Thiết lập thư mục uploads để truy cập tĩnh
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

router(app);
app.get('/', (req, res) => {
    res.send('Hello World');
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Kết nối đến cơ sở dữ liệu
connectDB();

// Các mã khác của ứng dụng...

// Thêm ở cuối tệp index.js
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({
        message: 'Đã xảy ra lỗi',
        error: err.message
    });
});
