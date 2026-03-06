import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace('/api', '')
    : 'http://localhost:5000';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth
export const loginUser = (data) => api.post('/auth/login', data);
export const registerUser = (data) => api.post('/auth/register', data);
export const getProfile = () => api.get('/auth/profile');
export const updateProfile = (data) => api.put('/auth/profile', data);

// Products
export const getProducts = (params) => api.get('/products', { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Cart
export const getCart = () => api.get('/cart');
export const addToCart = (data) => api.post('/cart/add', data);
export const updateCartItem = (productId, data) => api.put(`/cart/item/${productId}`, data);
export const removeFromCart = (productId) => api.delete(`/cart/item/${productId}`);
export const clearCart = () => api.delete('/cart');

// Orders
export const createOrder = (data) => api.post('/orders', data);
export const getMyOrders = () => api.get('/orders/my-orders');
export const getOrder = (id) => api.get(`/orders/${id}`);
export const getAllOrders = () => api.get('/orders');
export const updateOrderStatus = (id, data) => api.put(`/orders/${id}/status`, data);

// Chats
export const getMyChats = () => api.get('/chats/my-chats');
export const getAllChats = () => api.get('/chats');
export const getChat = (id) => api.get(`/chats/${id}`);
export const sendMessage = (id, data) => api.post(`/chats/${id}/message`, data);
export const createChat = (data) => api.post('/chats', data);

// Admin
export const getAdminStats = () => api.get('/admin/stats');
export const getAdminUsers = () => api.get('/admin/users');

export default api;
