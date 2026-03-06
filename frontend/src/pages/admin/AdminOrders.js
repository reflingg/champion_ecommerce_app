import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getAllOrders, updateOrderStatus } from '../../services/api';
import { FiBox, FiShoppingBag, FiMessageSquare, FiGrid } from 'react-icons/fi';

const AdminOrders = ({ showToast }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    const fetchOrders = async () => {
        try {
            const { data } = await getAllOrders();
            setOrders(data);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    const handleStatusChange = async (orderId, status) => {
        try {
            await updateOrderStatus(orderId, { status });
            showToast(`Order ${status}`, 'success');
            fetchOrders();
        } catch (error) {
            showToast('Failed to update order', 'error');
        }
    };

    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <div className="admin-layout">
            <div className="admin-sidebar">
                <h2>Admin Panel</h2>
                <Link to="/admin" className={isActive('/admin')}><FiGrid /> Dashboard</Link>
                <Link to="/admin/products" className={isActive('/admin/products')}><FiBox /> Products</Link>
                <Link to="/admin/orders" className={isActive('/admin/orders')}><FiShoppingBag /> Orders</Link>
                <Link to="/admin/chats" className={isActive('/admin/chats')}><FiMessageSquare /> Chats</Link>
                <Link to="/">← Back to Store</Link>
            </div>

            <div className="admin-content">
                <h1 className="page-title">Orders</h1>

                {loading ? (
                    <div className="loading"><div className="spinner"></div></div>
                ) : (
                    <div className="admin-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order._id}>
                                        <td>#{order._id.slice(-8).toUpperCase()}</td>
                                        <td>{order.user?.name || 'N/A'}<br /><small style={{ color: 'var(--text-light)' }}>{order.user?.email}</small></td>
                                        <td>{order.items?.length} items</td>
                                        <td>₦{order.totalAmount?.toFixed(2)}</td>
                                        <td><span className={`order-status ${order.status}`}>{order.status}</span></td>
                                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="confirmed">Confirmed</option>
                                                <option value="shipped">Shipped</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                                {orders.length === 0 && (
                                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>No orders yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminOrders;
