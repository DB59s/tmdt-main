const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục lưu trữ nếu chưa tồn tại
const createUploadDir = () => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const imagesDir = path.join(uploadDir, 'images');
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
    }
    
    const returnImagesDir = path.join(imagesDir, 'returns');
    if (!fs.existsSync(returnImagesDir)) {
        fs.mkdirSync(returnImagesDir, { recursive: true });
    }
    
    return returnImagesDir;
};

// Cấu hình storage cho multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = createUploadDir();
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Tạo tên file mới gồm timestamp + random string + extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'return-' + uniqueSuffix + ext);
    }
});

// Kiểm tra loại file
const fileFilter = (req, file, cb) => {
    // Chỉ chấp nhận file hình ảnh
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file hình ảnh'), false);
    }
};

// Cấu hình upload
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

/**
 * Upload nhiều hình ảnh
 */
exports.uploadMultipleImages = (req, res) => {
    const uploadMultiple = upload.array('images', 5); // Tối đa 5 file

    uploadMultiple(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // Lỗi từ multer
            return res.status(400).json({
                success: false,
                message: `Lỗi upload: ${err.message}`
            });
        } else if (err) {
            // Lỗi khác
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        // Upload thành công
        const uploadedFiles = req.files.map(file => {
            // Chuyển đổi đường dẫn lưu trữ thành URL có thể truy cập
            const relativePath = path.relative(path.join(__dirname, '../..'), file.path);
            const fileUrl = `${req.protocol}://${req.get('host')}/${relativePath.replace(/\\/g, '/')}`;
            
            return {
                filename: file.filename,
                originalname: file.originalname,
                size: file.size,
                path: file.path,
                url: fileUrl
            };
        });

        // Trả về thông tin các file đã upload
        res.status(200).json({
            success: true,
            message: 'Upload thành công',
            files: uploadedFiles,
            urls: uploadedFiles.map(file => file.url)
        });
    });
};

/**
 * Upload một hình ảnh
 */
exports.uploadSingleImage = (req, res) => {
    const uploadSingle = upload.single('image');

    console.log(req.body);

    uploadSingle(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // Lỗi từ multer
            return res.status(400).json({
                success: false,
                message: `Lỗi upload: ${err.message}`
            });
        } else if (err) {
            // Lỗi khác
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        // Upload thành công
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Không có file nào được tải lên'
            });
        }

        // Chuyển đổi đường dẫn lưu trữ thành URL có thể truy cập
        const relativePath = path.relative(path.join(__dirname, '../..'), req.file.path);
        const fileUrl = `${req.protocol}://${req.get('host')}/${relativePath.replace(/\\/g, '/')}`;

        // Trả về thông tin file đã upload
        res.status(200).json({
            success: true,
            message: 'Upload thành công',
            file: {
                filename: req.file.filename,
                originalname: req.file.originalname,
                size: req.file.size,
                path: req.file.path,
                url: fileUrl
            }
        });
    });
}; 