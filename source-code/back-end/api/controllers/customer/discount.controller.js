const Discount = require('../../models/discount.model');

module.exports.checkDiscount = async (req, res) => {
    try {
        const { code } = req.body;
        const discount = await Discount.findOne({ code });

        if (!discount) {
            return res.status(404).json({ message: 'Mã giảm giá không tồn tại' });
        }
        if (discount.status === 'inactive') {
            return res.status(404).json({ message: 'Mã giảm giá không tồn tại' });
        }
        if(discount.expirationDate < new Date()) {
            return res.status(404).json({ message: 'Mã giảm giá đã hết hạn' });
        }
        if(discount.quantity <= 0) {
            return res.status(404).json({ message: 'Mã giảm giá đã hết hạn' });
        }

        res.json(
            {
                success: true,
                discount: discount
            }
        );
    } catch (error) {
        console.error('Error checking discount:', error); // Log lỗi
        res.status(500).json({ message: 'Đã xảy ra lỗi khi kiểm tra mã giảm giá' });
    }
};


