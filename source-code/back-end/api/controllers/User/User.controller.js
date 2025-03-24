const User = require('../../models/User.model');
const { checkValidationResults } = require('../../../validate/validateRegister');
// const paginationHelper = require('../../../helper/pagination');

module.exports.User = async (req, res) => {

    const find = {
        deleted: false,
    };
    if (req.query.status) {
        find.status = req.query.status;
    }
    if (req.query.role_id) {
        find.role_id = req.query.role_id;
    }

    let initPagination = {
        currentPage: 1,
        limitItems: 10,
    };

    // const objectPagination = paginationHelper(initPagination, req.query);

    const { users, countUser } = await User.findUsersWithPagination(find);

    res.json({ users, countUser });
};
module.exports.getUserById = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    res.json(user);
};

module.exports.addUser = async (req, res) => {
    // console.log(req.body);
    checkValidationResults(req, res, async () => {
        const existUserName = await User.findOne({ 
            username: req.body.username,
            deleted : false
        });
        const existEmail = await User.findOne({
            email: req.body.email,
            deleted: false
        });

        if (existUserName || existEmail) {
            return res.json({
                code: 400,
                message: 'Username or email already exists'
            });
        } else {
            const newUser = await User.addUser(req.body);
            return res.json({
                code : 200,
                message: 'Register successfully!',
                user: newUser,
            });
        }
    });
};

module.exports.editUser = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
        return res.json({
            code: 400,
            message: 'User không tồn tại'
        });
    }

    await user.editUser(req.body);

    res.json({
        code: 200,
        message: 'Sửa user thành công',
        user
    });
};

module.exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
        return res.json({
            code: 400,
            message: 'User không tồn tại'
        });
    }

    // Tìm và cập nhật các blog có assignedTo bằng id của user
    await Blog.updateMany({ assignedTo: id }, { $set: { assignedTo: null } });

    // Xóa user
    await user.deleteUser();

    res.json({
        code: 200,
        message: 'Xóa user thành công và cập nhật các blog liên quan'
    });
};

module.exports.deleteManyUser = async (req, res) => {
    const { ids } = req.body;

    // Tìm và cập nhật các blog có assignedTo bằng các id của user
    await Blog.updateMany({ assignedTo: { $in: ids } }, { $set: { assignedTo: null } });

    // Xóa các user
    const result = await User.deleteMany({ _id: { $in: ids } });

    if (result.deletedCount > 0) { // Check if any documents were deleted
        res.json({
            code: 200,
            message: 'Xóa user thành công và cập nhật các blog liên quan'
        });
    } else {
        res.json({
            code: 400,
            message: 'Không có user nào được tìm thấy'
        });
    }
};
module.exports.editManyUser = async (req, res) => {
    try {
        const { id, ...updateFields } = req.body;
        await User.editManyUsers(id, updateFields);

        res.json({
            code: 200,
            message: 'Cập nhật user thành công'
        });
    } catch (error) {
        res.json({
            code: 400,
            message: error.message
        });
    }
};

