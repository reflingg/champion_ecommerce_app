const express = require('express');
const supabase = require('../config/db');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Helper to get cart with items and product details
const getCartWithItems = async (userId) => {
    // Get or create cart
    let { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .single();

    if (!cart) {
        const { data: newCart, error } = await supabase
            .from('carts')
            .insert({ user_id: userId })
            .select('id')
            .single();
        if (error) throw error;
        cart = newCart;
    }

    // Get cart items with product details
    const { data: items, error } = await supabase
        .from('cart_items')
        .select('id, quantity, product_id, products(id, name, description, price, category, images, stock, dim_width, dim_height, dim_depth, material, color, featured, rating, num_reviews)')
        .eq('cart_id', cart.id);

    if (error) throw error;

    return {
        _id: cart.id,
        user: userId,
        items: (items || []).map(item => ({
            product: item.products ? {
                _id: item.products.id,
                name: item.products.name,
                description: item.products.description,
                price: parseFloat(item.products.price),
                category: item.products.category,
                images: item.products.images || [],
                stock: item.products.stock,
                dimensions: { width: item.products.dim_width, height: item.products.dim_height, depth: item.products.dim_depth },
                material: item.products.material,
                color: item.products.color,
                featured: item.products.featured,
                rating: parseFloat(item.products.rating),
                numReviews: item.products.num_reviews,
            } : null,
            quantity: item.quantity,
            _id: item.id,
        })),
    };
};

// Get user's cart
router.get('/', protect, async (req, res) => {
    try {
        const cart = await getCartWithItems(req.user.id);
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add item to cart
router.post('/add', protect, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

        // Get or create cart
        let { data: cart } = await supabase
            .from('carts')
            .select('id')
            .eq('user_id', req.user.id)
            .single();

        if (!cart) {
            const { data: newCart } = await supabase
                .from('carts')
                .insert({ user_id: req.user.id })
                .select('id')
                .single();
            cart = newCart;
        }

        // Check if item already in cart
        const { data: existing } = await supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('cart_id', cart.id)
            .eq('product_id', productId)
            .single();

        if (existing) {
            await supabase
                .from('cart_items')
                .update({ quantity: existing.quantity + quantity })
                .eq('id', existing.id);
        } else {
            await supabase
                .from('cart_items')
                .insert({ cart_id: cart.id, product_id: productId, quantity });
        }

        const updatedCart = await getCartWithItems(req.user.id);
        res.json(updatedCart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update cart item quantity
router.put('/item/:productId', protect, async (req, res) => {
    try {
        const { quantity } = req.body;

        const { data: cart } = await supabase
            .from('carts')
            .select('id')
            .eq('user_id', req.user.id)
            .single();

        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        const { error } = await supabase
            .from('cart_items')
            .update({ quantity })
            .eq('cart_id', cart.id)
            .eq('product_id', req.params.productId);

        if (error) return res.status(404).json({ message: 'Item not found in cart' });

        const updatedCart = await getCartWithItems(req.user.id);
        res.json(updatedCart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Remove item from cart
router.delete('/item/:productId', protect, async (req, res) => {
    try {
        const { data: cart } = await supabase
            .from('carts')
            .select('id')
            .eq('user_id', req.user.id)
            .single();

        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        await supabase
            .from('cart_items')
            .delete()
            .eq('cart_id', cart.id)
            .eq('product_id', req.params.productId);

        const updatedCart = await getCartWithItems(req.user.id);
        res.json(updatedCart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Clear cart
router.delete('/', protect, async (req, res) => {
    try {
        const { data: cart } = await supabase
            .from('carts')
            .select('id')
            .eq('user_id', req.user.id)
            .single();

        if (cart) {
            await supabase
                .from('cart_items')
                .delete()
                .eq('cart_id', cart.id);
        }

        res.json({ message: 'Cart cleared' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
