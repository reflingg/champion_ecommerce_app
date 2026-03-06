import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getAllChats, getChat, sendMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import { FiBox, FiShoppingBag, FiMessageSquare, FiGrid, FiSend } from 'react-icons/fi';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const AdminChats = () => {
    const { user } = useAuth();
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);

    useEffect(() => {
        socketRef.current = io(SOCKET_URL);
        return () => socketRef.current?.disconnect();
    }, []);

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const { data } = await getAllChats();
                setChats(data);
            } catch (error) {
                console.error('Failed to fetch chats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchChats();
    }, []);

    useEffect(() => {
        if (activeChat && socketRef.current) {
            socketRef.current.emit('join-chat', activeChat._id);
            socketRef.current.on('new-message', (data) => {
                if (data.chatId === activeChat._id) {
                    setActiveChat(prev => ({
                        ...prev,
                        messages: [...prev.messages, data.message],
                    }));
                }
            });
            return () => socketRef.current.off('new-message');
        }
    }, [activeChat?._id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeChat?.messages]);

    const handleSelectChat = async (chatId) => {
        try {
            const { data } = await getChat(chatId);
            setActiveChat(data);
        } catch (error) {
            console.error('Failed to load chat:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim() || !activeChat) return;
        try {
            const { data } = await sendMessage(activeChat._id, { content: message });
            setActiveChat(data);
            socketRef.current.emit('send-message', {
                chatId: activeChat._id,
                message: data.messages[data.messages.length - 1],
            });
            setMessage('');
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

            <div className="admin-content" style={{ padding: '10px' }}>
                <div className="chat-container" style={{ height: 'calc(100vh - 110px)' }}>
                    <div className="chat-sidebar">
                        <div className="chat-sidebar-header">Customer Chats</div>
                        {loading ? (
                            <div className="loading"><div className="spinner"></div></div>
                        ) : chats.length === 0 ? (
                            <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-light)' }}>
                                No chats yet
                            </div>
                        ) : (
                            chats.map((chat) => (
                                <div
                                    key={chat._id}
                                    className={`chat-list-item ${activeChat?._id === chat._id ? 'active' : ''}`}
                                    onClick={() => handleSelectChat(chat._id)}
                                >
                                    <div className="chat-name">{chat.user?.name || 'Unknown User'}</div>
                                    <div className="chat-preview">
                                        {chat.order ? `Order #${chat.order._id?.slice(-8).toUpperCase()}` : 'General inquiry'}
                                    </div>
                                    <div className="chat-time">{formatTime(chat.lastMessage || chat.updatedAt)}</div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="chat-main">
                        {activeChat ? (
                            <>
                                <div className="chat-header">
                                    <span>{activeChat.user?.name} — {activeChat.order ? `Order #${activeChat.order._id?.slice(-8).toUpperCase()}` : 'General'}</span>
                                </div>
                                <div className="chat-messages">
                                    {activeChat.messages?.map((msg, i) => (
                                        <div
                                            key={i}
                                            className={`message ${msg.sender?._id === user._id || msg.sender === user._id ? 'sent' : 'received'}`}
                                        >
                                            <div className="sender-name">
                                                {msg.sender?.name || 'User'}
                                                {msg.sender?.role === 'admin' && ' (Admin)'}
                                            </div>
                                            <div>{msg.content}</div>
                                            <div className="time">{formatTime(msg.createdAt)}</div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                                <form className="chat-input" onSubmit={handleSendMessage}>
                                    <input
                                        type="text"
                                        placeholder="Reply to customer..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                    />
                                    <button type="submit" disabled={!message.trim()}>
                                        <FiSend />
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="no-chat-selected">
                                Select a customer conversation to respond
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminChats;
