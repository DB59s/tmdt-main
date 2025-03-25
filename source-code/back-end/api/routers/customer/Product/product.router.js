const express = require('express');
const router = express.Router();

const ProductController = require('../../../controllers/customer/products.controller');

router.get('/top-categories', ProductController.getTopCategories);
router.get('/by-status', ProductController.getProductsByStatus);
router.get('/', ProductController.getAllProducts);
router.get('/on-sale', ProductController.getOnSaleProducts);
router.get('/:id', ProductController.getProductById);
module.exports = router;

