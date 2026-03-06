const express = require('express');
const supabase = require('../config/db');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Create order from cart
router.post('/', protect, async (req, res) => {
    try {
        const { shippingAddress } = req.body;

        // Get cart with items
        const { data: cart } = await supabase
            .from('carts')
            .select('id')
            .eq('user_id', req.user.id)
            .single();

        if (!cart) return res.status(400).json({ message: 'Cart is empty' });

        const { data: cartItems } = await supabase
            .from('cart_items')
            .select('quantity, product_id, products(id, name, price, images)')
            .eq('cart_id', cart.id);

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const totalAmount = cartItems.reduce(
            (sum, item) => sum + parseFloat(item.products.price) * item.quantity, 0
        );

        // Create order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: req.user.id,
                total_amount: totalAmount,
                shipping_street: shippingAddress?.street,
                shipping_city: shippingAddress?.city,
                shipping_state: shippingAddress?.state,
                shipping_zip_code: shippingAddress?.zipCode,
                payment_method: 'chat',
            })
            .select('*')
            .single();

        if (orderError) throw orderError;

        // Create order items
        const orderItems = cartItems.map(item => ({
            order_id: order.id,
            product_id: item.products.id,
            name: item.products.name,
            price: parseFloat(item.products.price),
            quantity: item.quantity,
            image: (item.products.images && item.products.images[0]) || '',
        }));

        await supabase.from('order_items').insert(orderItems);

        // Create chat for this order
        const { data: chat } = await supabase
            .from('chats')
            .insert({
                user_id: req.user.id,
                order_id: order.id,
            })
            .select('id')
            .single();

        if (chat) {
            await supabase.from('messages').insert({
                chat_id: chat.id,
                sender_id: req.user.id,
                content: `Hi! I just placed an order #${order.id.slice(0, 8)} for $${totalAmount.toFixed(2)}. I'd like to proceed with payment.`,
            });
        }

        // Clear cart
        await supabase.from('cart_items').delete().eq('cart_id', cart.id);

        // Return formatted order
        res.status(201).json({
            _id: order.id,
            user: order.user_id,
            totalAmount: parseFloat(order.total_amount),
            shippingAddress: {
                street: order.shipping_street,
                city: order.shipping_city,
                state: order.shipping_state,
                zipCode: order.shipping_zip_code,
            },
            status: order.status,
            paymentMethod: order.payment_method,
            items: orderItems.map(i => ({ ...i, _id: i.order_id })),
            createdAt: order.created_at,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user's orders
router.get('/my-orders', protect, async (req, res) => {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*, order_items(*, products(id, name, price, images, category))')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const formatted = (orders || []).map(o => ({
            _id: o.id,
            user: o.user_id,
            totalAmount: parseFloat(o.total_amount),
            shippingAddress: {
                street: o.shipping_street,
                city: o.shipping_city,
                state: o.shipping_state,
                zipCode: o.shipping_zip_code,
            },
            status: o.status,
            paymentMethod: o.payment_method,
            items: (o.order_items || []).map(i => ({
                _id: i.id,
                product: i.products ? { _id: i.products.id, ...i.products, price: parseFloat(i.products.price) } : null,
                name: i.name,
                price: parseFloat(i.price),
                quantity: i.quantity,
                image: i.image,
            })),
            createdAt: o.created_at,
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single order
router.get('/:id', protect, async (req, res) => {
    try {
        const { data: order, error } = await supabase
            .from('orders')
            .select('*, order_items(*, products(id, name, price, images, category))')
            .eq('id', req.params.id)
            .single();

        if (error || !order) return res.status(404).json({ message: 'Order not found' });

        if (order.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json({
            _id: order.id,
            user: order.user_id,
            totalAmount: parseFloat(order.total_amount),
            shippingAddress: {
                street: order.shipping_street,
                city: order.shipping_city,
                state: order.shipping_state,
                zipCode: order.shipping_zip_code,
            },
            status: order.status,
            paymentMethod: order.payment_method,
            items: (order.order_items || []).map(i => ({
                _id: i.id,
                product: i.products ? { _id: i.products.id, ...i.products, price: parseFloat(i.products.price) } : null,
                name: i.name,
                price: parseFloat(i.price),
                quantity: i.quantity,
                image: i.image,
            })),
            createdAt: order.created_at,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all orders (admin)
router.get('/', protect, admin, async (req, res) => {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*, users(name, email), order_items(*)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const formatted = (orders || []).map(o => ({
            _id: o.id,
            user: o.users ? { _id: o.user_id, name: o.users.name, email: o.users.email } : o.user_id,
            totalAmount: parseFloat(o.total_amount),
            shippingAddress: {
                street: o.shipping_street,
                city: o.shipping_city,
                state: o.shipping_state,
                zipCode: o.shipping_zip_code,
            },
            status: o.status,
            paymentMethod: o.payment_method,
            items: (o.order_items || []).map(i => ({
                _id: i.id,
                name: i.name,
                price: parseFloat(i.price),
                quantity: i.quantity,
                image: i.image,
            })),
            createdAt: o.created_at,
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update order status (admin)
router.put('/:id/status', protect, admin, async (req, res) => {
    try {
        const { data: order, error } = await supabase
            .from('orders')
            .update({ status: req.body.status })
            .eq('id', req.params.id)
            .select('*')
            .single();

        if (error) return res.status(404).json({ message: 'Order not found' });

        res.json({
            _id: order.id,
            user: order.user_id,
            totalAmount: parseFloat(order.total_amount),
            status: order.status,
            createdAt: order.created_at,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
