import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import { FiSearch } from 'react-icons/fi';

const Products = ({ showToast }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const { addItem } = useCart();

    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        category: searchParams.get('category') || '',
        sort: searchParams.get('sort') || '',
    });

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const params = { page, limit: 12 };
                if (filters.search) params.search = filters.search;
                if (filters.category) params.category = filters.category;
                if (filters.sort) params.sort = filters.sort;

                const { data } = await getProducts(params);
                setProducts(data.products);
                setTotalPages(data.pages);
            } catch (error) {
                console.error('Failed to fetch products:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [page, filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1);
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        setSearchParams(params);
    };

    const handleAddToCart = async (productId) => {
        if (!user) {
            showToast('Please login to add items to cart', 'error');
            return;
        }
        try {
            await addItem(productId);
            showToast('Added to cart!', 'success');
        } catch (error) {
            showToast('Failed to add to cart', 'error');
        }
    };

    return (
        <div className="page-container">
            <h1 className="page-title">Our Furniture Collection</h1>

            <div className="filters-bar">
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#7F8C8D' }} />
                    <input
                        type="text"
                        placeholder="Search furniture..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        style={{ paddingLeft: '36px' }}
                    />
                </div>
                <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)}>
                    <option value="">All Categories</option>
                    <option value="living-room">Living Room</option>
                    <option value="bedroom">Bedroom</option>
                    <option value="dining">Dining</option>
                    <option value="office">Office</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="storage">Storage</option>
                </select>
                <select value={filters.sort} onChange={(e) => handleFilterChange('sort', e.target.value)}>
                    <option value="">Sort by: Latest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                </select>
            </div>

            {loading ? (
                <div className="loading"><div className="spinner"></div></div>
            ) : products.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">🔍</div>
                    <h2>No products found</h2>
                    <p>Try adjusting your search or filters</p>
                </div>
            ) : (
                <>
                    <div className="products-grid">
                        {products.map((product) => (
                            <ProductCard
                                key={product._id}
                                product={product}
                                onAddToCart={handleAddToCart}
                            />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '40px' }}>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i + 1}
                                    className={`btn btn-sm ${page === i + 1 ? 'btn-primary' : 'btn-outline'}`}
                                    onClick={() => setPage(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Products;
