const nodemailer = require('nodemailer');

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: envFile });

console.log(nodemailer);
// Cấu hình transporter
const transporter = nodemailer.createTransport({
    service: 'Gmail', // Hoặc dịch vụ email bạn muốn sử dụng
    auth: {
        user: process.env.EMAIL_USER, // Địa chỉ email của bạn
        pass: process.env.EMAIL_PASS  // Mật khẩu email của bạn
    }
});

const sendEmailSuccess = (to, orderId, status) => {
    console.log(process.env.EMAIL_USER);
    console.log(process.env.EMAIL_PASS);
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: `Đơn hàng #${orderId} đang được xác nhận`,
        text: `Đơn hàng của bạn với mã #${orderId} đang được xác nhận.
        Trạng thái đơn hàng sẽ được chúng tôi cập nhật bằng cách liên hệ với bạn thông qua gmail của bạn.
        Cảm ơn bạn đã đặt hàng.
            `
    };

    return transporter.sendMail(mailOptions);
};

// Hàm gửi email
const sendOrderStatusEmail = (to, orderId, status) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: `Cập nhật trạng thái đơn hàng #${orderId}`,
        text: `Đơn hàng của bạn với mã #${orderId} hiện đang có trạng thái: ${status}.`
    };

    return transporter.sendMail(mailOptions);
};

const sendEmailPaymentSuccess = (to, orderId, status) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: `Đơn hàng #${orderId} đã được thanh toán thành công`,
        text: `Đơn hàng của bạn với mã #${orderId} đã được thanh toán thành công.
        Cảm ơn bạn đã đặt hàng.
        `
    };

    return transporter.sendMail(mailOptions);
};

module.exports = { sendOrderStatusEmail, sendEmailSuccess, sendEmailPaymentSuccess, transporter }; 