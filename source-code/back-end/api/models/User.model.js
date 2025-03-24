const mongoose = require('mongoose');
const md5 = require('md5');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    birthday: {
        type: Date
    },
    fullname: {
        type: String
    },
    role_id: {
        type: String
    },
    status: {
        type: String,
    },
    deleted: {
        type: Boolean,
        default: false
    }
});

UserSchema.statics.login = async function (email, password) {
    const user = await this.findOne({ email, deleted: false });
    if (!user) {
        throw new Error('Email không tồn tại');
    }
    if (md5(password) !== user.password) {
        throw new Error('Mật khẩu không chính xác');
    }
    return user;
};

// Tạo người dùng mới
UserSchema.statics.addUser = async function (userData) {
    const hashedPassword = md5(userData.password);
    const newUser = new this({
        ...userData,
        password: hashedPassword
    });
    return await newUser.save();
};

// Chỉnh sửa người dùng
UserSchema.methods.editUser = async function (updatedData) {
    for (let key in updatedData) {
        if (updatedData.hasOwnProperty(key)) {
            if (key === 'password') {
                this[key] = md5(updatedData[key]);
            } else {
                this[key] = updatedData[key];
            }
        }
    }
    return await this.save();
};

// Xóa người dùng (soft delete)
UserSchema.methods.deleteUser = async function () {
    this.deleted = true;
    return await this.save();
};

// Xóa nhiều người dùng (soft delete)
UserSchema.statics.deleteManyUsers = async function (ids) {
    const result = await this.updateMany(
        { _id: { $in: ids } },
        { $set: { deleted: true } } // Ensure $set operator is used
    );
    return result;
};
// Tìm người dùng với phân trang
UserSchema.statics.findUsersWithPagination = async function (query, pagination) {
    const countUser = await this.countDocuments(query);
    const users = await this.find(query)
        .limit(pagination.limitItems)
        .skip(pagination.skip);
    return { users, countUser };
};

// sửa nhiều người dùng
UserSchema.statics.editManyUsers = async function (ids, updatedData) {
    for (let key in updatedData) {
        if (updatedData.hasOwnProperty(key)) {
            if (key === 'password') {
                updatedData[key] = md5(updatedData[key]);
            }
        }
    }
    return this.updateMany(
        { _id: { $in: ids } },
        { $set: updatedData }
    );
};

module.exports = mongoose.model('User', UserSchema);
