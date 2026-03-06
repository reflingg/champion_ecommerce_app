import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../services/api';
import { FiMessageSquare, FiPackage } from 'react-icons/fi';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data } = await getMyOrders();
                setOrders(data);
            } catch (error) {
                console.error('Failed to fetch orders:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div className="page-container">
            <h1 className="page-title">My Orders</h1>

            {orders.length === 0 ? (
                <div className="empty-state">
                    <div className="icon"><FiPackage /></div>
                    <h2>No orders yet</h2>
                    <p>Start shopping to see your orders here</p>
                    <Link to="/products" className="btn btn-primary">Browse Products</Link>
                </div>
            ) : (
                <div className="orders-list">
                    {orders.map((order) => (
                        <div className="order-card" key={order._id}>
                            <div className="order-card-header">
                                <h3>Order #{order._id.slice(-8).toUpperCase()}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span className={`order-status ${order.status}`}>
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div className="order-items">
                                {order.items.map((item, i) => (
                                    <div className="order-item" key={i}>
                                        <span>{item.name} × {item.quantity}</span>
                                        <span>₦{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Link to="/chat" className="btn btn-outline btn-sm">
                                    <FiMessageSquare /> Chat about this order
                                </Link>
                                <div className="order-total">Total: ₦{order.totalAmount.toFixed(2)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Orders;
