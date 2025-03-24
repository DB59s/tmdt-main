const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../../middleware/authMiddleware');
const roleMiddleware = require('../../../../middleware/roleMiddleware');
const ProductAdminController = require('../../../controllers/admin/products.admin.controller');

// Routes cho admin
router.post('/', authMiddleware(), roleMiddleware(['1']), ProductAdminController.createProduct);
router.patch('/:id', authMiddleware(), roleMiddleware(['1']), ProductAdminController.updateProduct);
router.delete('/:id', authMiddleware(), roleMiddleware(['1']), ProductAdminController.deleteProduct);

module.exports = router; 