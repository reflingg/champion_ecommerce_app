import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/api';
import { FiMessageSquare } from 'react-icons/fi';

const Checkout = ({ showToast }) => {
    const { cart, cartTotal, fetchCart } = useCart();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState({
        street: '',
        city: '',
        state: '',
        zipCode: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await createOrder({ shippingAddress: address });
            await fetchCart();
            showToast('Order placed! You can now chat with us about payment.', 'success');
            navigate('/chat');
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to place order', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!cart.items || cart.items.length === 0) {
        navigate('/cart');
        return null;
    }

    return (
        <div className="page-container">
            <h1 className="page-title">Checkout</h1>
            <div className="checkout-page">
                <div className="checkout-form">
                    <h2>Shipping Address</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Street Address</label>
                            <input
                                type="text"
                                value={address.street}
                                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                                placeholder="123 Main Street"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>City</label>
                            <input
                                type="text"
                                value={address.city}
                                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                placeholder="City"
                                required
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group">
                                <label>State</label>
                                <input
                                    type="text"
                                    value={address.state}
                                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                                    placeholder="State"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Zip Code</label>
                                <input
                                    type="text"
                                    value={address.zipCode}
                                    onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                                    placeholder="Zip Code"
                                    required
                                />
                            </div>
                        </div>

                        <div style={{
                            background: 'rgba(139, 94, 60, 0.05)',
                            padding: '20px',
                            borderRadius: '12px',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <FiMessageSquare /> Payment via Chat
                            </h3>
                            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
                                After placing your order, you'll be connected with our team via chat to arrange payment. We accept bank transfer, mobile money, and cash on delivery.
                            </p>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
                            {loading ? 'Placing Order...' : `Place Order — $${cartTotal.toFixed(2)}`}
                        </button>
                    </form>
                </div>

                <div className="cart-summary">
                    <h2>Order Summary</h2>
                    {cart.items.map((item) => (
                        <div className="summary-row" key={item.product?._id}>
                            <span>{item.product?.name} × {item.quantity}</span>
                            <span>${((item.product?.price || 0) * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="summary-row">
                        <span>Shipping</span>
                        <span style={{ color: 'var(--success)' }}>Free</span>
                    </div>
                    <div className="summary-row total">
                        <span>Total</span>
                        <span>${cartTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
