const jwt = require('jsonwebtoken');
const supabase = require('../config/db');

const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, role, phone, address_street, address_city, address_state, address_zip_code')
            .eq('id', decoded.id)
            .single();

        if (error || !user) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: 'Not authorized as admin' });
    }
};

module.exports = { protect, admin };
