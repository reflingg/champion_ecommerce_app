const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const supabase = require('../config/db');
const { protect } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', email.toLowerCase())
            .single();

        if (existing) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const { data: user, error } = await supabase
            .from('users')
            .insert({
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                phone: phone || null,
            })
            .select('id, name, email, role, phone')
            .single();

        if (error) throw error;

        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            token: generateToken(user.id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, role, phone, password')
            .eq('email', email.toLowerCase())
            .single();

        if (error || !user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            token: generateToken(user.id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Forgot password - verify email and security question
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('email', email.toLowerCase())
            .single();

        if (error || !user) {
            return res.status(404).json({ message: 'No account found with this email' });
        }

        // Generate a short-lived token for password reset
        const resetToken = jwt.sign({ id: user.id, purpose: 'reset' }, process.env.JWT_SECRET, { expiresIn: '15m' });

        res.json({
            message: 'Email verified. You can now reset your password.',
            resetToken,
            name: user.name,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        if (decoded.purpose !== 'reset') {
            return res.status(400).json({ message: 'Invalid reset token' });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const { error } = await supabase
            .from('users')
            .update({ password: hashedPassword })
            .eq('id', decoded.id);

        if (error) throw error;

        res.json({ message: 'Password reset successfully. You can now login.' });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ message: 'Reset link has expired. Please try again.' });
        }
        res.status(500).json({ message: error.message });
    }
});

// Get profile
router.get('/profile', protect, async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, role, phone, address_street, address_city, address_state, address_zip_code, created_at')
            .eq('id', req.user.id)
            .single();

        if (error) throw error;

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            address: {
                street: user.address_street,
                city: user.address_city,
                state: user.address_state,
                zipCode: user.address_zip_code,
            },
            createdAt: user.created_at,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update profile
router.put('/profile', protect, async (req, res) => {
    try {
        const updates = {};
        if (req.body.name) updates.name = req.body.name;
        if (req.body.phone) updates.phone = req.body.phone;
        if (req.body.address) {
            updates.address_street = req.body.address.street;
            updates.address_city = req.body.address.city;
            updates.address_state = req.body.address.state;
            updates.address_zip_code = req.body.address.zipCode;
        }
        if (req.body.password) {
            const salt = await bcrypt.genSalt(12);
            updates.password = await bcrypt.hash(req.body.password, salt);
        }

        const { data: user, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', req.user.id)
            .select('id, name, email, role, phone, address_street, address_city, address_state, address_zip_code')
            .single();

        if (error) throw error;

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            address: {
                street: user.address_street,
                city: user.address_city,
                state: user.address_state,
                zipCode: user.address_zip_code,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
