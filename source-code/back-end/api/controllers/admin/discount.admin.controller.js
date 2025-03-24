const Discount = require('../../models/discount.model');

// Lấy tất cả discount (có phân trang và lọc)
exports.getAllDiscounts = async (req, res) => {
    try {
        const { page = 1, limit = 10, code } = req.query;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        
        // Xây dựng query filter
        const filter = {};
        if (code) filter.code = { $regex: code, $options: 'i' };
        
        // Đếm tổng số discount thỏa mãn điều kiện
        const totalDiscounts = await Discount.countDocuments(filter);
        
        // Lấy danh sách discount với phân trang
        const discounts = await Discount.find(filter)
            .sort({ createdAt: -1 })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);
        
        return res.status(200).json({
            success: true,
            data: {
                discounts,
                pagination: {
                    total: totalDiscounts,
                    page: pageNumber,
                    limit: limitNumber,
                    totalPages: Math.ceil(totalDiscounts / limitNumber)
                }
            }
        });
    } catch (error) {
        console.error('Error getting discounts:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy danh sách mã giảm giá',
            error: error.message
        });
    }
};

// Lấy chi tiết discount theo ID
exports.getDiscountById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const discount = await Discount.findById(id);
        
        if (!discount) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy mã giảm giá'
            });
        }
        
        return res.status(200).json({
            success: true,
            data: discount
        });
    } catch (error) {
        console.error('Error getting discount details:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy chi tiết mã giảm giá',
            error: error.message
        });
    }
};

// Tạo mới discount
exports.createDiscount = async (req, res) => {
    try {
        const { code, amount, quantity, expirationDate } = req.body;
        
        // Kiểm tra xem mã giảm giá đã tồn tại chưa
        const existingDiscount = await Discount.findOne({ code });
        if (existingDiscount) {
            return res.status(400).json({
                success: false,
                message: 'Mã giảm giá này đã tồn tại'
            });
        }
        
        // Validate dữ liệu đầu vào
        if (!code || !amount || !quantity || !expirationDate) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin: code, amount, quantity, expirationDate'
            });
        }
        
        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Số tiền giảm giá phải lớn hơn 0'
            });
        }
        
        if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng mã giảm giá phải lớn hơn 0'
            });
        }
        
        // Kiểm tra ngày hết hạn
        const expDate = new Date(expirationDate);
        if (isNaN(expDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Ngày hết hạn không hợp lệ'
            });
        }
        
        if (expDate < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Ngày hết hạn phải lớn hơn ngày hiện tại'
            });
        }
        
        // Tạo mới discount
        const newDiscount = new Discount({
            code,
            amount,
            quantity,
            expirationDate: expDate
        });
        
        await newDiscount.save();
        
        return res.status(201).json({
            success: true,
            message: 'Tạo mã giảm giá thành công',
            data: newDiscount
        });
    } catch (error) {
        console.error('Error creating discount:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi tạo mã giảm giá',
            error: error.message
        });
    }
};

// Cập nhật discount
exports.updateDiscount = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, amount, quantity, expirationDate } = req.body;
        
        // Kiểm tra xem discount có tồn tại không
        const discount = await Discount.findById(id);
        if (!discount) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy mã giảm giá'
            });
        }
        
        // Kiểm tra nếu thay đổi code, đảm bảo code mới chưa tồn tại
        if (code && code !== discount.code) {
            const existingDiscount = await Discount.findOne({ code });
            if (existingDiscount) {
                return res.status(400).json({
                    success: false,
                    message: 'Mã giảm giá này đã tồn tại'
                });
            }
        }
        
        // Validate dữ liệu đầu vào
        if (amount !== undefined && amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Số tiền giảm giá phải lớn hơn 0'
            });
        }
        
        if (quantity !== undefined && quantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng mã giảm giá không được âm'
            });
        }
        
        // Kiểm tra ngày hết hạn
        let expDate;
        if (expirationDate) {
            expDate = new Date(expirationDate);
            if (isNaN(expDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Ngày hết hạn không hợp lệ'
                });
            }
            
            if (expDate < new Date()) {
                return res.status(400).json({
                    success: false,
                    message: 'Ngày hết hạn phải lớn hơn ngày hiện tại'
                });
            }
        }
        
        // Cập nhật thông tin discount
        const updateData = {};
        if (code) updateData.code = code;
        if (amount !== undefined) updateData.amount = amount;
        if (quantity !== undefined) updateData.quantity = quantity;
        if (expDate) updateData.expirationDate = expDate;
        
        const updatedDiscount = await Discount.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );
        
        return res.status(200).json({
            success: true,
            message: 'Cập nhật mã giảm giá thành công',
            data: updatedDiscount
        });
    } catch (error) {
        console.error('Error updating discount:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi cập nhật mã giảm giá',
            error: error.message
        });
    }
};

// Xóa discount
exports.deleteDiscount = async (req, res) => {
    try {
        const { id } = req.params;
        
        const discount = await Discount.findById(id);
        if (!discount) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy mã giảm giá'
            });
        }
        
        await Discount.findByIdAndDelete(id);
        
        return res.status(200).json({
            success: true,
            message: 'Xóa mã giảm giá thành công'
        });
    } catch (error) {
        console.error('Error deleting discount:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi xóa mã giảm giá',
            error: error.message
        });
    }
};

// Xóa nhiều discount cùng lúc
exports.deleteMultipleDiscounts = async (req, res) => {
    try {
        const { ids } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp danh sách ID hợp lệ'
            });
        }
        
        const result = await Discount.deleteMany({ _id: { $in: ids } });
        
        return res.status(200).json({
            success: true,
            message: `Đã xóa ${result.deletedCount} mã giảm giá thành công`
        });
    } catch (error) {
        console.error('Error deleting multiple discounts:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi xóa nhiều mã giảm giá',
            error: error.message
        });
    }
};
