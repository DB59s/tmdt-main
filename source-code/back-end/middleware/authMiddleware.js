const jwt = require('jsonwebtoken');

const authMiddleware = () => {
    return (req, res, next) => { 
        const token = req.headers['authorization'];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        try {
            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            // Lưu thông tin người dùng vào req thay vì session
            req.user = decoded;
            next();
        } catch (error) {
            console.error('JWT verification error:', error);
            return res.status(401).json({ message: 'Failed to authenticate token' });
        }
    }
}
module.exports = authMiddleware;