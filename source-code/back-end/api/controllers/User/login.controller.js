const User = require('../../models/User.model');
// const ForgotPassword = require('../../models/ForgotPassword.model');
const jwt = require('jsonwebtoken');
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';

require('dotenv').config({ path: envFile });


module.exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.login(email, password);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        

        const expiresIn = 180 * 60; // Token expiration time in seconds

        // Tạo token JWT
        const token = jwt.sign(
            {  id: user.id,
            role : user.role_id },
            process.env.SECRET_KEY,
            { expiresIn }
        );

        // Trả token về cho người dùng
        res.json({ 
            token ,
            expiresAt: expiresIn,
            email: user.email,
            username : user.username,
            id : user.id,
            role_id : user.role_id
        });
        } catch (error) {
            res.json({
                code: 400,
                message: error.message
            });
        }
}

// module.exports.forgotPassword = async (req, res) => {
//     const { email } = req.body;
//     try {
//         const user = await User.findOne({ email : email }); 
//         if (!user) {
//             return res.json({
//                 code: 400,
//                 message: 'Email không tồn tại'
//             });
//         }
//         await ForgotPassword.createForgotPassword(email);
//         res.json({
//             code: 200,
//             message: 'Mã OTP đã được gửi đến email của bạn',
//             email: email
//         }) ;
//     } catch (error) {
//         res.json({
//             code: 400,
//             message: error.message
//         });
// };
// };

// module.exports.otp = async (req, res) => {
//     const { email, otp } = req.body;

//     try {
//         const result = await ForgotPassword.verifyOtp(email, otp);
//         const user = await User.findOne({ email });
//         const session_id = user.session_id;

//         res.json({
//             code: 200,
//             message: 'Xác nhận thành công',
//             session_id: session_id
//         });
//     } catch (error) {
//         res.json({
//             code: 400,
//             message: error.message
//         });
//     }
// };

// module.exports.resetPassword = async (req, res) => {
//     const { session_id, password } = req.body;
//     try {
//         const result = await ForgotPassword.resetPassword(session_id, password);
//         res.json(result);
//     } catch (error) {
//         res.json({
//             code: 400,
//             message: error.message
//         });
//     }
// };

// module.exports.logout = async (req, res) => {
//     res.clearCookie('token');
//     res.json({
//         code: 200,
//         message: 'Đăng xuất thành công'
//     });
// };
