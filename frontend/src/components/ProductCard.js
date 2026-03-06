import React from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiEye } from 'react-icons/fi';
import { GiWoodenChair } from 'react-icons/gi';

const ProductCard = ({ product, onAddToCart }) => {
    const categoryLabels = {
        'living-room': 'Living Room',
        'bedroom': 'Bedroom',
        'dining': 'Dining',
        'office': 'Office',
        'outdoor': 'Outdoor',
        'storage': 'Storage',
    };

    const mainImage = product.images && product.images.length > 0 ? product.images[0] : null;

    return (
        <div className="product-card">
            <div className="product-card-image">
                {mainImage ? (
                    <img src={mainImage} alt={product.name} />
                ) : (
                    <GiWoodenChair />
                )}
                {product.featured && <span className="featured-badge">Featured</span>}
            </div>
            <div className="product-card-body">
                <span className="category-tag">{categoryLabels[product.category] || product.category}</span>
                <h3>{product.name}</h3>
                <div className="rating">
                    {'★'.repeat(Math.floor(product.rating))}{'☆'.repeat(5 - Math.floor(product.rating))}
                    <span>({product.numReviews})</span>
                </div>
                <div className="price">₦{product.price.toFixed(2)}</div>
                <div className="product-card-actions">
                    <Link to={`/products/${product._id}`} className="btn btn-outline btn-sm">
                        <FiEye /> View
                    </Link>
                    {onAddToCart && (
                        <button className="btn btn-primary btn-sm" onClick={() => onAddToCart(product._id)}>
                            <FiShoppingCart /> Add
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
