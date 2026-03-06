const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const supabase = require('./config/db');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const chatRoutes = require('./routes/chats');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? process.env.FRONTEND_URL || false
            : 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
});

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL || false
        : 'http://localhost:3000',
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/admin', adminRoutes);

// Socket.IO for real-time chat
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-chat', (chatId) => {
        socket.join(chatId);
        console.log(`User joined chat: ${chatId}`);
    });

    socket.on('send-message', (data) => {
        socket.to(data.chatId).emit('new-message', data);
    });

    socket.on('typing', (data) => {
        socket.to(data.chatId).emit('user-typing', data);
    });

    socket.on('stop-typing', (data) => {
        socket.to(data.chatId).emit('user-stop-typing', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Health check endpoint
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
