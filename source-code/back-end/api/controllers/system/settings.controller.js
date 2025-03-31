const mongoose = require('mongoose');
const Setting = require('../../models/setting.model');

/**
 * Lấy tất cả cài đặt hệ thống
 */
exports.getAllSettings = async (req, res) => {
    try {
        const settings = await Setting.find();
        
        // Chuyển đổi mảng cài đặt thành đối tượng để dễ sử dụng
        const settingsObj = {};
        settings.forEach(setting => {
            settingsObj[setting.key] = setting.value;
        });
        
        res.status(200).json({
            success: true,
            data: settingsObj
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy cài đặt hệ thống',
            error: error.message
        });
    }
};

/**
 * Lấy một cài đặt cụ thể theo key
 */
exports.getSettingByKey = async (req, res) => {
    try {
        const { key } = req.params;
        
        const setting = await Setting.findOne({ key });
        
        if (!setting) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy cài đặt với key này'
            });
        }
        
        res.status(200).json({
            success: true,
            data: setting
        });
    } catch (error) {
        console.error('Error fetching setting:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy cài đặt hệ thống',
            error: error.message
        });
    }
};

/**
 * Cập nhật một cài đặt
 */
exports.updateSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const { value, description } = req.body;
        
        if (value === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Giá trị cài đặt là bắt buộc'
            });
        }
        
        let setting = await Setting.findOne({ key });
        
        if (!setting) {
            // Tạo mới nếu không tồn tại
            setting = new Setting({
                key,
                value,
                description: description || ''
            });
        } else {
            // Cập nhật nếu đã tồn tại
            setting.value = value;
            if (description) {
                setting.description = description;
            }
        }
        
        await setting.save();
        
        res.status(200).json({
            success: true,
            message: 'Cập nhật cài đặt thành công',
            data: setting
        });
    } catch (error) {
        console.error('Error updating setting:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật cài đặt hệ thống',
            error: error.message
        });
    }
};

/**
 * Cập nhật nhiều cài đặt cùng lúc
 */
exports.updateMultipleSettings = async (req, res) => {
    try {
        const { settings } = req.body;
        
        if (!settings || !Array.isArray(settings)) {
            return res.status(400).json({
                success: false,
                message: 'Cần cung cấp một mảng các cài đặt cần cập nhật'
            });
        }
        
        const updatedSettings = [];
        
        // Sử dụng Promise.all để xử lý song song các cập nhật
        await Promise.all(settings.map(async (setting) => {
            const { key, value, description } = setting;
            
            if (!key || value === undefined) {
                return;
            }
            
            let existingSetting = await Setting.findOne({ key });
            
            if (!existingSetting) {
                existingSetting = new Setting({
                    key,
                    value,
                    description: description || ''
                });
            } else {
                existingSetting.value = value;
                if (description) {
                    existingSetting.description = description;
                }
            }
            
            await existingSetting.save();
            updatedSettings.push(existingSetting);
        }));
        
        res.status(200).json({
            success: true,
            message: `Đã cập nhật ${updatedSettings.length} cài đặt`,
            data: updatedSettings
        });
    } catch (error) {
        console.error('Error updating multiple settings:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật nhiều cài đặt hệ thống',
            error: error.message
        });
    }
};

/**
 * Xóa một cài đặt
 */
exports.deleteSetting = async (req, res) => {
    try {
        const { key } = req.params;
        
        const result = await Setting.deleteOne({ key });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy cài đặt để xóa'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Đã xóa cài đặt thành công'
        });
    } catch (error) {
        console.error('Error deleting setting:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa cài đặt hệ thống',
            error: error.message
        });
    }
}; 