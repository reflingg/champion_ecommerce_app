import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { GiWoodenChair } from 'react-icons/gi';

const CartPage = ({ showToast }) => {
    const { cart, updateQuantity, removeItem, cartTotal, loading } = useCart();
    const navigate = useNavigate();

    const handleUpdateQuantity = async (productId, newQty) => {
        try {
            if (newQty < 1) return;
            await updateQuantity(productId, newQty);
        } catch (error) {
            showToast('Failed to update quantity', 'error');
        }
    };

    const handleRemove = async (productId) => {
        try {
            await removeItem(productId);
            showToast('Item removed from cart', 'info');
        } catch (error) {
            showToast('Failed to remove item', 'error');
        }
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    if (!cart.items || cart.items.length === 0) {
        return (
            <div className="page-container">
                <div className="empty-state">
                    <div className="icon"><FiShoppingBag /></div>
                    <h2>Your cart is empty</h2>
                    <p>Looks like you haven't added any furniture yet</p>
                    <Link to="/products" className="btn btn-primary">Start Shopping</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <h1 className="page-title">Shopping Cart</h1>
            <div className="cart-page">
                <div className="cart-items">
                    {cart.items.map((item) => (
                        <div className="cart-item" key={item.product?._id || item._id}>
                            <div className="cart-item-image">
                                <GiWoodenChair />
                            </div>
                            <div className="cart-item-info">
                                <h3>{item.product?.name}</h3>
                                <div className="price">${item.product?.price?.toFixed(2)}</div>
                                <div className="cart-item-actions">
                                    <div className="quantity-control">
                                        <button onClick={() => handleUpdateQuantity(item.product?._id, item.quantity - 1)}>
                                            <FiMinus />
                                        </button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => handleUpdateQuantity(item.product?._id, item.quantity + 1)}>
                                            <FiPlus />
                                        </button>
                                    </div>
                                    <button className="cart-item-remove" onClick={() => handleRemove(item.product?._id)}>
                                        <FiTrash2 /> Remove
                                    </button>
                                </div>
                            </div>
                            <div style={{ fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                                ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="cart-summary">
                    <h2>Order Summary</h2>
                    <div className="summary-row">
                        <span>Items ({cart.items.length})</span>
                        <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                        <span>Shipping</span>
                        <span style={{ color: 'var(--success)' }}>Free</span>
                    </div>
                    <div className="summary-row total">
                        <span>Total</span>
                        <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <button className="btn btn-primary" onClick={() => navigate('/checkout')}>
                        Proceed to Checkout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
