import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../services/api';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { FiArrowRight } from 'react-icons/fi';
import { GiSofa, GiBed, GiTable, GiOfficeChair, GiParkBench, GiBookshelf } from 'react-icons/gi';

const Home = () => {
    const [featured, setFeatured] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { addItem } = useCart();

    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                const { data } = await getProducts({ featured: true, limit: 4 });
                setFeatured(data.products);
            } catch (error) {
                console.error('Failed to fetch featured products:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchFeatured();
    }, []);

    const categories = [
        { name: 'Living Room', slug: 'living-room', icon: <GiSofa /> },
        { name: 'Bedroom', slug: 'bedroom', icon: <GiBed /> },
        { name: 'Dining', slug: 'dining', icon: <GiTable /> },
        { name: 'Office', slug: 'office', icon: <GiOfficeChair /> },
        { name: 'Outdoor', slug: 'outdoor', icon: <GiParkBench /> },
        { name: 'Storage', slug: 'storage', icon: <GiBookshelf /> },
    ];

    const handleAddToCart = async (productId) => {
        if (!user) return;
        try {
            await addItem(productId);
        } catch (error) {
            console.error('Failed to add to cart:', error);
        }
    };

    return (
        <div>
            <section className="hero">
                <h1>Furnish Your Dream Home</h1>
                <p>Discover premium, handcrafted furniture that combines style, comfort, and durability. Shop with us and transform your space.</p>
                <div className="hero-buttons">
                    <Link to="/products" className="btn btn-primary">
                        Shop Now <FiArrowRight />
                    </Link>
                    {!user && (
                        <Link to="/register" className="btn btn-outline">
                            Create Account
                        </Link>
                    )}
                </div>
            </section>

            <section className="categories-section">
                <h2>Shop by Category</h2>
                <div className="categories-grid">
                    {categories.map((cat) => (
                        <Link to={`/products?category=${cat.slug}`} key={cat.slug}>
                            <div className="category-card">
                                <div className="icon">{cat.icon}</div>
                                <h3>{cat.name}</h3>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="featured-section">
                <h2>Featured Products</h2>
                {loading ? (
                    <div className="loading"><div className="spinner"></div></div>
                ) : (
                    <div className="products-grid">
                        {featured.map((product) => (
                            <ProductCard
                                key={product._id}
                                product={product}
                                onAddToCart={user ? handleAddToCart : null}
                            />
                        ))}
                    </div>
                )}
                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                    <Link to="/products" className="btn btn-outline">
                        View All Products <FiArrowRight />
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Home;
