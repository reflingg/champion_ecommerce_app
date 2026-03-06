import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getAdminStats } from '../../services/api';
import { FiBox, FiShoppingBag, FiUsers, FiMessageSquare, FiDollarSign, FiGrid } from 'react-icons/fi';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await getAdminStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <h2>Admin Panel</h2>
        <Link to="/admin" className={isActive('/admin')}>
          <FiGrid /> Dashboard
        </Link>
        <Link to="/admin/products" className={isActive('/admin/products')}>
          <FiBox /> Products
        </Link>
        <Link to="/admin/orders" className={isActive('/admin/orders')}>
          <FiShoppingBag /> Orders
        </Link>
        <Link to="/admin/chats" className={isActive('/admin/chats')}>
          <FiMessageSquare /> Chats
        </Link>
        <Link to="/">
          ← Back to Store
        </Link>
      </div>

      <div className="admin-content">
        <h1 className="page-title">Dashboard</h1>

        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon" style={{ color: 'var(--primary)' }}><FiDollarSign /></div>
                <div className="stat-value">${stats?.revenue?.toFixed(2) || '0.00'}</div>
                <div className="stat-label">Total Revenue</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ color: 'var(--accent)' }}><FiShoppingBag /></div>
                <div className="stat-value">{stats?.totalOrders || 0}</div>
                <div className="stat-label">Total Orders</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ color: 'var(--success)' }}><FiBox /></div>
                <div className="stat-value">{stats?.totalProducts || 0}</div>
                <div className="stat-label">Products</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ color: '#3498DB' }}><FiUsers /></div>
                <div className="stat-value">{stats?.totalUsers || 0}</div>
                <div className="stat-label">Customers</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ color: '#9B59B6' }}><FiMessageSquare /></div>
                <div className="stat-value">{stats?.activeChats || 0}</div>
                <div className="stat-label">Active Chats</div>
              </div>
            </div>

            <h2 style={{ marginBottom: '20px' }}>Recent Orders</h2>
            <div className="admin-table">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentOrders?.map((order) => (
                    <tr key={order._id}>
                      <td>#{order._id.slice(-8).toUpperCase()}</td>
                      <td>{order.user?.name || 'N/A'}</td>
                      <td>${order.totalAmount?.toFixed(2)}</td>
                      <td><span className={`order-status ${order.status}`}>{order.status}</span></td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>No orders yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
