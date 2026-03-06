import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getAllChats, getChat, sendMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import { FiBox, FiShoppingBag, FiMessageSquare, FiGrid, FiSend, FiUser, FiCheck } from 'react-icons/fi';

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
    const inputRef = useRef(null);

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
            inputRef.current?.focus();
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formatDate = (date) => {
        const d = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (d.toDateString() === today.toDateString()) return 'Today';
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
    };
    const getMessageDate = (dateStr) => new Date(dateStr).toDateString();
    const isSentByMe = (msg) => msg.sender?._id === user._id || msg.sender === user._id;
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
                <div className="modern-chat-wrapper" style={{ height: 'calc(100vh - 110px)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    {/* Customer List */}
                    <div className="modern-chat-sidebar visible">
                        <div className="modern-chat-sidebar-header">
                            <h2>Customer Chats</h2>
                        </div>
                        <div className="modern-chat-list">
                            {loading ? (
                                <div className="loading"><div className="spinner"></div></div>
                            ) : chats.length === 0 ? (
                                <div className="modern-chat-empty">
                                    <FiMessageSquare style={{ fontSize: '2rem', marginBottom: '12px', opacity: 0.4 }} />
                                    <p>No customer chats yet</p>
                                </div>
                            ) : (
                                chats.map((chat) => (
                                    <div
                                        key={chat._id}
                                        className={`modern-chat-item ${activeChat?._id === chat._id ? 'active' : ''}`}
                                        onClick={() => handleSelectChat(chat._id)}
                                    >
                                        <div className="modern-chat-item-avatar">
                                            <FiUser />
                                        </div>
                                        <div className="modern-chat-item-content">
                                            <div className="modern-chat-item-top">
                                                <span className="modern-chat-item-name">{chat.user?.name || 'Unknown User'}</span>
                                                <span className="modern-chat-item-time">{formatTime(chat.lastMessage || chat.updatedAt)}</span>
                                            </div>
                                            <div className="modern-chat-item-preview">
                                                {chat.order ? `Order #${chat.order._id?.slice(-8).toUpperCase()}` : 'General inquiry'}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Window */}
                    <div className="modern-chat-window visible">
                        {activeChat ? (
                            <>
                                <div className="modern-chat-window-header">
                                    <div className="modern-chat-window-avatar"><FiUser /></div>
                                    <div className="modern-chat-window-info">
                                        <div className="modern-chat-window-name">{activeChat.user?.name}</div>
                                        <div className="modern-chat-window-status">
                                            {activeChat.order ? `Order #${activeChat.order._id?.slice(-8).toUpperCase()}` : 'General'}
                                        </div>
                                    </div>
                                </div>

                                <div className="modern-chat-messages">
                                    {activeChat.messages?.map((msg, i) => {
                                        const showDate = i === 0 || getMessageDate(msg.createdAt) !== getMessageDate(activeChat.messages[i - 1].createdAt);
                                        const sent = isSentByMe(msg);
                                        return (
                                            <React.Fragment key={i}>
                                                {showDate && (
                                                    <div className="modern-chat-date-divider">
                                                        <span>{formatDate(msg.createdAt)}</span>
                                                    </div>
                                                )}
                                                <div className={`modern-chat-bubble-wrapper ${sent ? 'sent' : 'received'}`}>
                                                    <div className={`modern-chat-bubble ${sent ? 'sent' : 'received'}`}>
                                                        {!sent && (
                                                            <div className="modern-chat-sender">{msg.sender?.name || 'Customer'}</div>
                                                        )}
                                                        <div className="modern-chat-text">{msg.content}</div>
                                                        <div className="modern-chat-meta">
                                                            <span>{formatTime(msg.createdAt)}</span>
                                                            {sent && <FiCheck size={12} />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </React.Fragment>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                <form className="modern-chat-input-bar" onSubmit={handleSendMessage}>
                                    <div className="modern-chat-input-wrapper">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            placeholder="Reply to customer..."
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                        />
                                    </div>
                                    <button type="submit" className="modern-chat-send-btn" disabled={!message.trim()}>
                                        <FiSend />
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="modern-chat-no-selection">
                                <FiMessageSquare style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.3 }} />
                                <h3>Customer Support</h3>
                                <p>Select a customer conversation to respond</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminChats;
