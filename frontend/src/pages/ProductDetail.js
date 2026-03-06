import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { FiShoppingCart, FiMinus, FiPlus, FiCopy, FiImage } from 'react-icons/fi';
import { GiWoodenChair } from 'react-icons/gi';

const ProductDetail = ({ showToast }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const { user } = useAuth();
    const { addItem } = useCart();
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data } = await getProduct(id);
                setProduct(data);
            } catch (error) {
                console.error('Failed to fetch product:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleAddToCart = async () => {
        if (!user) {
            showToast('Please login to add items to cart', 'error');
            navigate('/login');
            return;
        }
        try {
            await addItem(product._id, quantity);
            showToast('Added to cart!', 'success');
        } catch (error) {
            showToast('Failed to add to cart', 'error');
        }
    };

    const categoryLabels = {
        'living-room': 'Living Room',
        'bedroom': 'Bedroom',
        'dining': 'Dining',
        'office': 'Office',
        'outdoor': 'Outdoor',
        'storage': 'Storage',
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;
    if (!product) return <div className="page-container"><h2>Product not found</h2></div>;

    const hasImages = product.images && product.images.length > 0;

    const copyImageUrl = (url) => {
        navigator.clipboard.writeText(url);
        showToast('Image URL copied!', 'info');
    };

    return (
        <div className="page-container">
            <div className="product-detail">
                <div>
                    <div className="product-detail-image">
                        {hasImages ? (
                            <img src={product.images[selectedImage]} alt={product.name} />
                        ) : (
                            <GiWoodenChair />
                        )}
                    </div>
                    {hasImages && product.images.length > 1 && (
                        <div className="product-image-gallery">
                            {product.images.map((img, idx) => (
                                <div
                                    key={idx}
                                    className={`thumb ${idx === selectedImage ? 'active' : ''}`}
                                    onClick={() => setSelectedImage(idx)}
                                >
                                    <img src={img} alt={`${product.name} ${idx + 1}`} />
                                </div>
                            ))}
                        </div>
                    )}
                    {isAdmin && hasImages && (
                        <div className="product-images-info" style={{ marginTop: '16px', padding: '12px', background: 'rgba(184,134,11,0.06)', borderRadius: '8px' }}>
                            <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                <FiImage /> Product Image URLs
                            </strong>
                            {product.images.map((url, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', fontSize: '0.8rem' }}>
                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6B7280' }}>
                                        {url}
                                    </span>
                                    <button
                                        onClick={() => copyImageUrl(url)}
                                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px' }}
                                        title="Copy URL"
                                    >
                                        <FiCopy />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="product-detail-info">
                    <span className="category-tag" style={{ marginBottom: '12px', display: 'inline-block' }}>
                        {categoryLabels[product.category] || product.category}
                    </span>
                    <h1>{product.name}</h1>
                    <div className="rating" style={{ margin: '12px 0' }}>
                        {'★'.repeat(Math.floor(product.rating))}{'☆'.repeat(5 - Math.floor(product.rating))}
                        <span>({product.numReviews} reviews)</span>
                    </div>
                    <div className="price">₦{product.price.toFixed(2)}</div>
                    <p className="description">{product.description}</p>

                    <div className="specs">
                        {product.material && (
                            <div><strong>Material</strong><span>{product.material}</span></div>
                        )}
                        {product.color && (
                            <div><strong>Color</strong><span>{product.color}</span></div>
                        )}
                        {product.dimensions?.width && (
                            <div><strong>Dimensions</strong><span>{product.dimensions.width} × {product.dimensions.height} × {product.dimensions.depth}</span></div>
                        )}
                    </div>

                    <div className={`stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    </div>

                    {product.stock > 0 && (
                        <>
                            <div className="quantity-control">
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                                    <FiMinus />
                                </button>
                                <span>{quantity}</span>
                                <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}>
                                    <FiPlus />
                                </button>
                            </div>

                            <button className="btn btn-primary btn-lg" onClick={handleAddToCart}>
                                <FiShoppingCart />
                                Add to Cart — ₦{(product.price * quantity).toFixed(2)}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
