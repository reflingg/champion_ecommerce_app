const express = require('express');
const supabase = require('../config/db');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Dashboard stats
router.get('/stats', protect, admin, async (req, res) => {
    try {
        const { count: totalUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'user');

        const { count: totalProducts } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });

        const { count: totalOrders } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });

        const { count: activeChats } = await supabase
            .from('chats')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        // Recent orders
        const { data: recentOrders } = await supabase
            .from('orders')
            .select('*, users(name, email)')
            .order('created_at', { ascending: false })
            .limit(5);

        // Revenue (non-cancelled orders)
        const { data: revenueData } = await supabase
            .from('orders')
            .select('total_amount')
            .neq('status', 'cancelled');

        const revenue = (revenueData || []).reduce(
            (sum, o) => sum + parseFloat(o.total_amount), 0
        );

        res.json({
            totalUsers: totalUsers || 0,
            totalProducts: totalProducts || 0,
            totalOrders: totalOrders || 0,
            activeChats: activeChats || 0,
            revenue,
            recentOrders: (recentOrders || []).map(o => ({
                _id: o.id,
                user: o.users ? { _id: o.user_id, name: o.users.name, email: o.users.email } : o.user_id,
                totalAmount: parseFloat(o.total_amount),
                status: o.status,
                createdAt: o.created_at,
            })),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all users (admin)
router.get('/users', protect, admin, async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, name, email, role, phone, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const formatted = (users || []).map(u => ({
            _id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            phone: u.phone,
            createdAt: u.created_at,
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
