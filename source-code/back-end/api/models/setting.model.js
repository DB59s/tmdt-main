const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    description: {
        type: String,
        default: ''
    }
}, { timestamps: true });

// Đánh index cho key để tìm kiếm nhanh hơn
settingSchema.index({ key: 1 });

const Setting = mongoose.model('Setting', settingSchema);

module.exports = Setting; 