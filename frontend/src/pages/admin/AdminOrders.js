import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getAllOrders, updateOrderStatus } from '../../services/api';
import { FiBox, FiShoppingBag, FiMessageSquare, FiGrid, FiSearch, FiChevronDown, FiChevronUp, FiImage, FiCopy, FiPackage } from 'react-icons/fi';

const AdminOrders = ({ showToast }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
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

    const copyId = (id) => {
        navigator.clipboard.writeText(id);
        showToast('ID copied!', 'success');
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = search === '' ||
            order._id.toLowerCase().includes(search.toLowerCase()) ||
            order.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            order.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
            order.items?.some(item => item.name?.toLowerCase().includes(search.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

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

                {/* Search & Filter Bar */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                        <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                        <input
                            type="text"
                            placeholder="Search by Order ID, customer, or product name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: '100%', padding: '10px 12px 10px 36px', border: '2px solid var(--border)',
                                borderRadius: '10px', fontSize: '0.9rem', outline: 'none', background: 'var(--bg-card)',
                            }}
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '10px 16px', borderRadius: '10px', border: '2px solid var(--border)', fontSize: '0.9rem', background: 'var(--bg-card)' }}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                {loading ? (
                    <div className="loading"><div className="spinner"></div></div>
                ) : filteredOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>
                        <FiPackage style={{ fontSize: '2.5rem', marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
                        {search || statusFilter !== 'all' ? 'No orders match your search' : 'No orders yet'}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {filteredOrders.map((order) => (
                            <div key={order._id} style={{
                                background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)',
                                overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            }}>
                                {/* Order Header Row */}
                                <div
                                    onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                                    style={{
                                        display: 'grid', gridTemplateColumns: 'auto 1fr auto auto auto auto',
                                        gap: '16px', alignItems: 'center', padding: '16px 20px', cursor: 'pointer',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(184,134,11,0.03)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {expandedOrder === order._id ? <FiChevronUp /> : <FiChevronDown />}
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--primary)' }}>
                                                #{order._id.slice(-8).toUpperCase()}
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); copyId(order._id); }}
                                                style={{ background: 'none', border: 'none', fontSize: '0.7rem', color: 'var(--text-light)', cursor: 'pointer', padding: '2px 0', display: 'flex', alignItems: 'center', gap: '3px' }}
                                            >
                                                <FiCopy size={10} /> Copy full ID
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{order.user?.name || 'N/A'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{order.user?.email}</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Items</div>
                                        <div style={{ fontWeight: 600 }}>{order.items?.length}</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Total</div>
                                        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>₦{order.totalAmount?.toFixed(2)}</div>
                                    </div>
                                    <span className={`order-status ${order.status}`}>{order.status}</span>
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.8rem' }}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Expanded Order Items */}
                                {expandedOrder === order._id && (
                                    <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', background: 'rgba(253,246,227,0.3)' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Ordered Products
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {order.items?.map((item, idx) => (
                                                <div key={idx} style={{
                                                    display: 'flex', alignItems: 'center', gap: '14px',
                                                    background: 'var(--bg-card)', borderRadius: '10px', padding: '12px',
                                                    border: '1px solid var(--border)',
                                                }}>
                                                    {/* Product Image */}
                                                    <div style={{
                                                        width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden',
                                                        flexShrink: 0, background: '#f5e6c8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                        {item.image || item.product?.images?.[0] ? (
                                                            <img
                                                                src={item.image || item.product?.images?.[0]}
                                                                alt={item.name}
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                        ) : (
                                                            <FiImage style={{ color: 'var(--primary)', fontSize: '1.2rem' }} />
                                                        )}
                                                    </div>
                                                    {/* Product Info */}
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px' }}>{item.name}</div>
                                                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-light)' }}>
                                                            <span>Qty: {item.quantity}</span>
                                                            <span>₦{item.price?.toFixed(2)} each</span>
                                                        </div>
                                                        {item.product?._id && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontFamily: 'monospace' }}>
                                                                    ID: {item.product._id.slice(-8)}
                                                                </span>
                                                                <button
                                                                    onClick={() => copyId(item.product._id)}
                                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '0', display: 'flex' }}
                                                                >
                                                                    <FiCopy size={11} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Item Total */}
                                                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                                        ₦{(item.price * item.quantity).toFixed(2)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Shipping & Date */}
                                        <div style={{ display: 'flex', gap: '20px', marginTop: '14px', fontSize: '0.8rem', color: 'var(--text-light)', flexWrap: 'wrap' }}>
                                            {order.shippingAddress?.street && (
                                                <span>📍 {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state}</span>
                                            )}
                                            <span>📅 {new Date(order.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminOrders;
