const jwt = require('jsonwebtoken');

const roleMiddleware = (requiredRoles = []) => {
    return (req, res, next) => {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const userRole = user.role || '';
        
        const hasRole = requiredRoles.includes(userRole);

        if (!hasRole) {
            return res.status(403).json({ message: 'Access denied of Role' });
        }

        next();
    };
}

module.exports = roleMiddleware;