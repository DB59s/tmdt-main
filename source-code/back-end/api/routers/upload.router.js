const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const authMiddleware = require('../../middleware/authMiddleware');

// Upload nhiều hình ảnh
router.post('/multiple', uploadController.uploadMultipleImages);

// Upload một hình ảnh
router.post('/', uploadController.uploadSingleImage);

module.exports = router; 