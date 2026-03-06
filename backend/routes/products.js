const express = require('express');
const supabase = require('../config/db');
const { protect, admin } = require('../middleware/auth');
const { upload, uploadToCloudinary } = require('../config/cloudinary');

const router = express.Router();

// Helper to format product from DB row
const formatProduct = (p) => ({
    _id: p.id,
    name: p.name,
    description: p.description,
    price: parseFloat(p.price),
    category: p.category,
    images: p.images || [],
    stock: p.stock,
    dimensions: { width: p.dim_width, height: p.dim_height, depth: p.dim_depth },
    material: p.material,
    color: p.color,
    featured: p.featured,
    rating: parseFloat(p.rating),
    numReviews: p.num_reviews,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
});

// Get all products (public)
router.get('/', async (req, res) => {
    try {
        const { category, search, featured, sort, page = 1, limit = 12 } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const from = (pageNum - 1) * limitNum;
        const to = from + limitNum - 1;

        let query = supabase.from('products').select('*', { count: 'exact' });

        if (category) query = query.eq('category', category);
        if (featured === 'true') query = query.eq('featured', true);
        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        if (sort === 'price-low') query = query.order('price', { ascending: true });
        else if (sort === 'price-high') query = query.order('price', { ascending: false });
        else if (sort === 'rating') query = query.order('rating', { ascending: false });
        else query = query.order('created_at', { ascending: false });

        query = query.range(from, to);

        const { data: products, count, error } = await query;
        if (error) throw error;

        res.json({
            products: products.map(formatProduct),
            page: pageNum,
            pages: Math.ceil((count || 0) / limitNum),
            total: count || 0,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single product (public)
router.get('/:id', async (req, res) => {
    try {
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error || !product) return res.status(404).json({ message: 'Product not found' });
        res.json(formatProduct(product));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create product (admin)
router.post('/', protect, admin, upload.array('images', 5), async (req, res) => {
    try {
        const { name, description, price, category, stock, material, color, featured, dim_width, dim_height, dim_depth } = req.body;

        let images = req.body.images || [];
        if (req.files && req.files.length > 0) {
            const uploads = await Promise.all(req.files.map(f => uploadToCloudinary(f.buffer)));
            images = uploads.map(u => u.secure_url);
        }

        const { data: product, error } = await supabase
            .from('products')
            .insert({
                name,
                description,
                price: parseFloat(price),
                category,
                images: Array.isArray(images) ? images : [images],
                stock: parseInt(stock) || 0,
                dim_width: dim_width || null,
                dim_height: dim_height || null,
                dim_depth: dim_depth || null,
                material: material || null,
                color: color || null,
                featured: featured === 'true' || featured === true,
            })
            .select('*')
            .single();

        if (error) throw error;
        res.status(201).json(formatProduct(product));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update product (admin)
router.put('/:id', protect, admin, upload.array('images', 5), async (req, res) => {
    try {
        const updates = {};
        const fields = ['name', 'description', 'category', 'material', 'color'];
        fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

        if (req.body.price !== undefined) updates.price = parseFloat(req.body.price);
        if (req.body.stock !== undefined) updates.stock = parseInt(req.body.stock);
        if (req.body.featured !== undefined) updates.featured = req.body.featured === 'true' || req.body.featured === true;
        if (req.body.dim_width) updates.dim_width = req.body.dim_width;
        if (req.body.dim_height) updates.dim_height = req.body.dim_height;
        if (req.body.dim_depth) updates.dim_depth = req.body.dim_depth;

        if (req.files && req.files.length > 0) {
            const uploads = await Promise.all(req.files.map(f => uploadToCloudinary(f.buffer)));
            updates.images = uploads.map(u => u.secure_url);
        } else if (req.body.images) {
            updates.images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
        }

        const { data: product, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', req.params.id)
            .select('*')
            .single();

        if (error) return res.status(404).json({ message: 'Product not found' });
        res.json(formatProduct(product));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete product (admin)
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', req.params.id);

        if (error) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Upload images (admin) - standalone endpoint
router.post('/upload', protect, admin, upload.array('images', 5), async (req, res) => {
    try {
        const uploads = await Promise.all(req.files.map(f => uploadToCloudinary(f.buffer)));
        const urls = uploads.map(u => u.secure_url);
        res.json({ urls });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
