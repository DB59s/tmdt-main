const express = require('express');
const router = express.Router();
const cartController = require('../../../controllers/customer/cart.controller');
const { optionalAuthMiddleware } = require('../../../../middleware/customerAuth');

// Get customer's active cart
router.get('/:customerId?', optionalAuthMiddleware, cartController.getCart);

// Add item to cart
router.post('/items/:customerId?', optionalAuthMiddleware, cartController.addItem);

// Update item quantity in cart
router.put('/items/:productId/:customerId?', optionalAuthMiddleware, cartController.updateItemQuantity);

// Remove item from cart
router.delete('/items/:productId/:customerId?', optionalAuthMiddleware, cartController.removeItem);

// Clear cart (remove all items)
router.delete('/:customerId?', optionalAuthMiddleware, cartController.clearCart);

module.exports = router; 