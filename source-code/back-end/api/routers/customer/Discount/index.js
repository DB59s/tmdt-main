const express = require('express');
const router = express.Router();
const discountController = require('../../../controllers/customer/discount.controller');

router.post('/check-discount', discountController.checkDiscount);

module.exports = router;