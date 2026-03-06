const express = require('express');
const supabase = require('../config/db');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Helper to format chat
const formatChat = (chat) => ({
    _id: chat.id,
    user: chat.users ? { _id: chat.user_id, name: chat.users.name, email: chat.users.email } : chat.user_id,
    order: chat.orders ? {
        _id: chat.orders.id,
        totalAmount: parseFloat(chat.orders.total_amount),
        status: chat.orders.status,
    } : chat.order_id,
    status: chat.status,
    lastMessage: chat.last_message,
    messages: (chat.messages || []).map(m => ({
        _id: m.id,
        sender: m.users ? { _id: m.sender_id, name: m.users.name, role: m.users.role } : m.sender_id,
        content: m.content,
        read: m.read,
        createdAt: m.created_at,
    })),
    createdAt: chat.created_at,
});

// Get user's chats
router.get('/my-chats', protect, async (req, res) => {
    try {
        const { data: chats, error } = await supabase
            .from('chats')
            .select('*, users(name, email), orders(id, total_amount, status)')
            .eq('user_id', req.user.id)
            .order('last_message', { ascending: false });

        if (error) throw error;

        const result = (chats || []).map(c => ({
            _id: c.id,
            user: c.users ? { _id: c.user_id, name: c.users.name, email: c.users.email } : c.user_id,
            order: c.orders ? { _id: c.orders.id, totalAmount: parseFloat(c.orders.total_amount), status: c.orders.status } : null,
            status: c.status,
            lastMessage: c.last_message,
            createdAt: c.created_at,
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all chats (admin)
router.get('/', protect, admin, async (req, res) => {
    try {
        const { data: chats, error } = await supabase
            .from('chats')
            .select('*, users(name, email), orders(id, total_amount, status)')
            .order('last_message', { ascending: false });

        if (error) throw error;

        const result = (chats || []).map(c => ({
            _id: c.id,
            user: c.users ? { _id: c.user_id, name: c.users.name, email: c.users.email } : c.user_id,
            order: c.orders ? { _id: c.orders.id, totalAmount: parseFloat(c.orders.total_amount), status: c.orders.status } : null,
            status: c.status,
            lastMessage: c.last_message,
            createdAt: c.created_at,
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single chat with messages
router.get('/:id', protect, async (req, res) => {
    try {
        const { data: chat, error } = await supabase
            .from('chats')
            .select('*, users(name, email), orders(id, total_amount, status)')
            .eq('id', req.params.id)
            .single();

        if (error || !chat) return res.status(404).json({ message: 'Chat not found' });

        if (chat.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Get messages
        const { data: messages } = await supabase
            .from('messages')
            .select('*, users(name, role)')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: true });

        const result = {
            _id: chat.id,
            user: chat.users ? { _id: chat.user_id, name: chat.users.name, email: chat.users.email } : chat.user_id,
            order: chat.orders ? { _id: chat.orders.id, totalAmount: parseFloat(chat.orders.total_amount), status: chat.orders.status } : null,
            status: chat.status,
            lastMessage: chat.last_message,
            messages: (messages || []).map(m => ({
                _id: m.id,
                sender: m.users ? { _id: m.sender_id, name: m.users.name, role: m.users.role } : m.sender_id,
                content: m.content,
                read: m.read,
                createdAt: m.created_at,
            })),
            createdAt: chat.created_at,
        };

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Send message in chat
router.post('/:id/message', protect, async (req, res) => {
    try {
        const { data: chat, error: chatError } = await supabase
            .from('chats')
            .select('id, user_id')
            .eq('id', req.params.id)
            .single();

        if (chatError || !chat) return res.status(404).json({ message: 'Chat not found' });

        if (chat.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Insert message
        await supabase.from('messages').insert({
            chat_id: chat.id,
            sender_id: req.user.id,
            content: req.body.content,
        });

        // Update last_message timestamp
        await supabase
            .from('chats')
            .update({ last_message: new Date().toISOString() })
            .eq('id', chat.id);

        // Return full chat with messages
        const { data: fullChat } = await supabase
            .from('chats')
            .select('*, users(name, email), orders(id, total_amount, status)')
            .eq('id', chat.id)
            .single();

        const { data: messages } = await supabase
            .from('messages')
            .select('*, users(name, role)')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: true });

        res.json({
            _id: fullChat.id,
            user: fullChat.users ? { _id: fullChat.user_id, name: fullChat.users.name, email: fullChat.users.email } : fullChat.user_id,
            order: fullChat.orders ? { _id: fullChat.orders.id, totalAmount: parseFloat(fullChat.orders.total_amount), status: fullChat.orders.status } : null,
            status: fullChat.status,
            lastMessage: fullChat.last_message,
            messages: (messages || []).map(m => ({
                _id: m.id,
                sender: m.users ? { _id: m.sender_id, name: m.users.name, role: m.users.role } : m.sender_id,
                content: m.content,
                read: m.read,
                createdAt: m.created_at,
            })),
            createdAt: fullChat.created_at,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a general chat (not tied to order)
router.post('/', protect, async (req, res) => {
    try {
        const { data: chat, error: chatError } = await supabase
            .from('chats')
            .insert({ user_id: req.user.id })
            .select('id')
            .single();

        if (chatError) throw chatError;

        await supabase.from('messages').insert({
            chat_id: chat.id,
            sender_id: req.user.id,
            content: req.body.content || 'Hi! I have a question.',
        });

        // Return populated
        const { data: fullChat } = await supabase
            .from('chats')
            .select('*, users(name, email)')
            .eq('id', chat.id)
            .single();

        const { data: messages } = await supabase
            .from('messages')
            .select('*, users(name, role)')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: true });

        res.status(201).json({
            _id: fullChat.id,
            user: fullChat.users ? { _id: fullChat.user_id, name: fullChat.users.name, email: fullChat.users.email } : fullChat.user_id,
            order: null,
            status: fullChat.status,
            lastMessage: fullChat.last_message,
            messages: (messages || []).map(m => ({
                _id: m.id,
                sender: m.users ? { _id: m.sender_id, name: m.users.name, role: m.users.role } : m.sender_id,
                content: m.content,
                read: m.read,
                createdAt: m.created_at,
            })),
            createdAt: fullChat.created_at,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
