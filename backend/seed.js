const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabase = require('./config/db');

const seedData = async () => {
    try {
        console.log('Clearing existing data...');
        await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('chats').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('cart_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('carts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        console.log('Creating users...');
        const salt = await bcrypt.genSalt(12);

        const { data: adminUser, error: adminError } = await supabase
            .from('users')
            .insert({
                name: 'Admin',
                email: 'admin@champion.com',
                password: await bcrypt.hash('admin123', salt),
                role: 'admin',
                phone: '555-0100',
            })
            .select('id')
            .single();

        if (adminError) throw adminError;

        const { error: userError } = await supabase
            .from('users')
            .insert({
                name: 'John Doe',
                email: 'john@example.com',
                password: await bcrypt.hash('password123', salt),
                role: 'user',
                phone: '555-0101',
                address_street: '123 Main Street',
                address_city: 'New York',
                address_state: 'NY',
                address_zip_code: '10001',
            });

        if (userError) throw userError;

        console.log('Creating products...');
        const products = [
            {
                name: 'Modern Living Room Sofa',
                description: 'A beautiful 3-seater sofa with premium fabric upholstery. Perfect for modern living rooms with its clean lines and comfortable cushions.',
                price: 899.99,
                category: 'living-room',
                images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'],
                stock: 15,
                dim_width: '220cm', dim_height: '85cm', dim_depth: '95cm',
                material: 'Fabric',
                color: 'Gray',
                featured: true,
                rating: 4.5,
                num_reviews: 12,
            },
            {
                name: 'Oak Dining Table Set',
                description: 'Solid oak dining table with 6 matching chairs. A timeless piece that brings warmth and elegance to any dining room.',
                price: 1299.99,
                category: 'dining',
                images: ['https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800'],
                stock: 8,
                dim_width: '180cm', dim_height: '76cm', dim_depth: '90cm',
                material: 'Oak Wood',
                color: 'Natural Oak',
                featured: true,
                rating: 4.8,
                num_reviews: 8,
            },
            {
                name: 'Queen Size Bed Frame',
                description: 'Elegant queen size bed frame with padded headboard. Built with sturdy construction and a modern aesthetic.',
                price: 749.99,
                category: 'bedroom',
                images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800'],
                stock: 12,
                dim_width: '160cm', dim_height: '120cm', dim_depth: '210cm',
                material: 'Wood & Upholstery',
                color: 'Walnut',
                featured: true,
                rating: 4.3,
                num_reviews: 15,
            },
            {
                name: 'Ergonomic Office Chair',
                description: 'Premium ergonomic office chair with lumbar support, adjustable height, and breathable mesh back.',
                price: 449.99,
                category: 'office',
                images: ['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800'],
                stock: 25,
                dim_width: '68cm', dim_height: '125cm', dim_depth: '68cm',
                material: 'Mesh & Metal',
                color: 'Black',
                featured: false,
                rating: 4.6,
                num_reviews: 22,
            },
            {
                name: 'Outdoor Patio Set',
                description: 'Weather-resistant patio furniture set including 2 chairs, a loveseat, and a coffee table. Perfect for outdoor relaxation.',
                price: 1099.99,
                category: 'outdoor',
                images: ['https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800'],
                stock: 6,
                dim_width: '200cm', dim_height: '85cm', dim_depth: '150cm',
                material: 'Rattan & Aluminum',
                color: 'Brown',
                featured: true,
                rating: 4.4,
                num_reviews: 9,
            },
            {
                name: 'Bookshelf Unit',
                description: 'Tall 5-tier bookshelf with industrial design. Perfect for displaying books, photos, and decorative items.',
                price: 299.99,
                category: 'storage',
                images: ['https://images.unsplash.com/photo-1594620302200-9a762244a156?w=800'],
                stock: 20,
                dim_width: '80cm', dim_height: '180cm', dim_depth: '35cm',
                material: 'Wood & Metal',
                color: 'Rustic Brown',
                featured: false,
                rating: 4.2,
                num_reviews: 18,
            },
            {
                name: 'Coffee Table',
                description: 'Minimalist coffee table with storage shelf. Clean design that complements any living room décor.',
                price: 199.99,
                category: 'living-room',
                images: ['https://images.unsplash.com/photo-1532588472432-45e5ca5e3588?w=800'],
                stock: 30,
                dim_width: '110cm', dim_height: '45cm', dim_depth: '60cm',
                material: 'MDF & Steel',
                color: 'White',
                featured: false,
                rating: 4.1,
                num_reviews: 25,
            },
            {
                name: 'Wardrobe Cabinet',
                description: 'Spacious 3-door wardrobe with mirror, hanging rail, and internal shelves. Ample storage for all your clothes.',
                price: 649.99,
                category: 'bedroom',
                images: ['https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=800'],
                stock: 10,
                dim_width: '150cm', dim_height: '200cm', dim_depth: '60cm',
                material: 'Engineered Wood',
                color: 'White',
                featured: false,
                rating: 4.0,
                num_reviews: 11,
            },
            {
                name: 'Executive Office Desk',
                description: 'Large L-shaped executive desk with cable management, drawers, and a spacious work surface.',
                price: 599.99,
                category: 'office',
                images: ['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800'],
                stock: 14,
                dim_width: '160cm', dim_height: '76cm', dim_depth: '120cm',
                material: 'Wood & Steel',
                color: 'Dark Walnut',
                featured: true,
                rating: 4.7,
                num_reviews: 13,
            },
            {
                name: 'TV Entertainment Unit',
                description: 'Modern TV stand with storage compartments and cable management. Fits TVs up to 65 inches.',
                price: 399.99,
                category: 'living-room',
                images: ['https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=800'],
                stock: 18,
                dim_width: '160cm', dim_height: '50cm', dim_depth: '40cm',
                material: 'MDF',
                color: 'Matte Black',
                featured: false,
                rating: 4.3,
                num_reviews: 16,
            },
            {
                name: 'Garden Bench',
                description: 'Classic wooden garden bench with armrests. Weather-treated for long-lasting outdoor use.',
                price: 249.99,
                category: 'outdoor',
                images: ['https://images.unsplash.com/photo-1591129841117-3adfd313e34f?w=800'],
                stock: 22,
                dim_width: '150cm', dim_height: '90cm', dim_depth: '60cm',
                material: 'Acacia Wood',
                color: 'Natural',
                featured: false,
                rating: 4.5,
                num_reviews: 7,
            },
            {
                name: 'Dining Sideboard',
                description: 'Elegant sideboard with sliding doors and drawers. Perfect for storing dinnerware and table linens.',
                price: 549.99,
                category: 'dining',
                images: ['https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800'],
                stock: 9,
                dim_width: '140cm', dim_height: '85cm', dim_depth: '40cm',
                material: 'Solid Wood',
                color: 'Honey Oak',
                featured: false,
                rating: 4.6,
                num_reviews: 5,
            },
        ];

        const { error: productError } = await supabase.from('products').insert(products);
        if (productError) throw productError;

        console.log('\nSeed data imported successfully!');
        console.log('Admin login: admin@champion.com / admin123');
        console.log('User login: john@example.com / password123');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
