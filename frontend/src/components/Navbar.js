import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiMessageSquare, FiGrid, FiLogOut } from 'react-icons/fi';
import logo from '../asset/images/champion furniture logo.png';

const Navbar = () => {
    const { user, logout, isAdmin } = useAuth();
    const { cartCount } = useCart();
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    const isActive = (path) => location.pathname === path ? 'active' : '';

    const firstName = user?.name ? user.name.split(' ')[0] : '';

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    <img src={logo} alt="Champion Furniture" className="navbar-logo-img" />
                    Champion
                </Link>

                <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
                    {mobileOpen ? <FiX /> : <FiMenu />}
                </button>

                <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
                    <Link to="/products" className={isActive('/products')} onClick={() => setMobileOpen(false)}>
                        Products
                    </Link>

                    {user ? (
                        <>
                            <div className="navbar-user-greeting">
                                <FiUser />
                                Hi, {firstName}
                            </div>
                            <Link to="/cart" className={`${isActive('/cart')} cart-badge`} onClick={() => setMobileOpen(false)}>
                                <FiShoppingCart />
                                Cart
                                {cartCount > 0 && <span>{cartCount}</span>}
                            </Link>
                            <Link to="/orders" className={isActive('/orders')} onClick={() => setMobileOpen(false)}>
                                Orders
                            </Link>
                            <Link to="/chat" className={isActive('/chat')} onClick={() => setMobileOpen(false)}>
                                <FiMessageSquare />
                                Chat
                            </Link>
                            {isAdmin && (
                                <Link to="/admin" className={isActive('/admin')} onClick={() => setMobileOpen(false)}>
                                    <FiGrid />
                                    Admin
                                </Link>
                            )}
                            <button onClick={() => { logout(); setMobileOpen(false); }}>
                                <FiLogOut />
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className={isActive('/login')} onClick={() => setMobileOpen(false)}>
                                <FiUser />
                                Login
                            </Link>
                            <Link to="/register" className={`btn btn-primary btn-sm ${isActive('/register')}`} onClick={() => setMobileOpen(false)}>
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
