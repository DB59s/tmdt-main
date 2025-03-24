const express = require('express');
const router = express.Router();
const CategoryController = require('../../../controllers/customer/category.controller');

router.get('/', CategoryController.getAllCategories); // Lấy tất cả danh mục

module.exports = router; 