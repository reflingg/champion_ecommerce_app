import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/CartPage';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import ChatPage from './pages/ChatPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminChats from './pages/admin/AdminChats';
import InstallPrompt from './components/InstallPrompt';
import Toast from './components/Toast';

import './App.css';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="loading"><div className="spinner"></div></div>;
    return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
    const { user, isAdmin, loading } = useAuth();
    if (loading) return <div className="loading"><div className="spinner"></div></div>;
    if (!user) return <Navigate to="/login" />;
    return isAdmin ? children : <Navigate to="/" />;
};

function AppContent() {
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login showToast={showToast} />} />
                <Route path="/register" element={<Register showToast={showToast} />} />
                <Route path="/products" element={<Products showToast={showToast} />} />
                <Route path="/products/:id" element={<ProductDetail showToast={showToast} />} />
                <Route path="/cart" element={<ProtectedRoute><CartPage showToast={showToast} /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute><Checkout showToast={showToast} /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                <Route path="/chat/:id" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/products" element={<AdminRoute><AdminProducts showToast={showToast} /></AdminRoute>} />
                <Route path="/admin/orders" element={<AdminRoute><AdminOrders showToast={showToast} /></AdminRoute>} />
                <Route path="/admin/chats" element={<AdminRoute><AdminChats /></AdminRoute>} />
            </Routes>
            <Footer />
            <InstallPrompt />
            {toast && <Toast message={toast.message} type={toast.type} />}
        </Router>
    );
}

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <AppContent />
            </CartProvider>
        </AuthProvider>
    );
}

export default App;
