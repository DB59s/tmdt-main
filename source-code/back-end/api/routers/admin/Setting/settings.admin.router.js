const express = require('express');
const router = express.Router();
const SettingsController = require('../../../controllers/system/settings.controller');
const authMiddleware = require('../../../../middleware/authMiddleware');
const roleMiddleware = require('../../../../middleware/roleMiddleware');

// Lấy tất cả cài đặt
router.get('/', authMiddleware(), roleMiddleware(['1']), SettingsController.getAllSettings);

// Lấy cài đặt theo key
router.get('/:key', authMiddleware(), roleMiddleware(['1']), SettingsController.getSettingByKey);

// Cập nhật một cài đặt
router.put('/:key', authMiddleware(), roleMiddleware(['1']), SettingsController.updateSetting);

// Cập nhật nhiều cài đặt cùng lúc
router.put('/', authMiddleware(), roleMiddleware(['1']), SettingsController.updateMultipleSettings);

// Xóa cài đặt
router.delete('/:key', authMiddleware(), roleMiddleware(['1']), SettingsController.deleteSetting);

module.exports = router; 