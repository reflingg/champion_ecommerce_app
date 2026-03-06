import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMyChats, getChat, sendMessage, createChat } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { FiSend, FiPlus, FiMessageSquare, FiArrowLeft, FiSmile, FiCheck, FiCheckCircle } from 'react-icons/fi';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const ChatPage = () => {
    const { id: chatIdParam } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showSidebar, setShowSidebar] = useState(true);
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        socketRef.current = io(SOCKET_URL);
        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const { data } = await getMyChats();
                setChats(data);
                if (chatIdParam) {
                    const chatData = await getChat(chatIdParam);
                    setActiveChat(chatData.data);
                    setShowSidebar(false);
                } else if (data.length > 0) {
                    const chatData = await getChat(data[0]._id);
                    setActiveChat(chatData.data);
                }
            } catch (error) {
                console.error('Failed to fetch chats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchChats();
    }, [chatIdParam]);

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
            setShowSidebar(false);
            navigate(`/chat/${chatId}`);
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

    const handleNewChat = async () => {
        try {
            const { data } = await createChat({ content: 'Hi! I have a question about your furniture.' });
            setChats(prev => [data, ...prev]);
            setActiveChat(data);
            setShowSidebar(false);
            navigate(`/chat/${data._id}`);
        } catch (error) {
            console.error('Failed to create chat:', error);
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
        return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getMessageDate = (dateStr) => new Date(dateStr).toDateString();

    const isSentByMe = (msg) => msg.sender?._id === user._id || msg.sender === user._id;

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div className="modern-chat-wrapper">
            {/* Chat List Sidebar */}
            <div className={`modern-chat-sidebar ${showSidebar ? 'visible' : ''}`}>
                <div className="modern-chat-sidebar-header">
                    <h2>Messages</h2>
                    <button className="modern-chat-new-btn" onClick={handleNewChat} title="New conversation">
                        <FiPlus />
                    </button>
                </div>

                <div className="modern-chat-list">
                    {chats.length === 0 ? (
                        <div className="modern-chat-empty">
                            <FiMessageSquare style={{ fontSize: '2rem', marginBottom: '12px', opacity: 0.4 }} />
                            <p>No conversations yet</p>
                            <button className="btn btn-primary btn-sm" onClick={handleNewChat}>Start a Chat</button>
                        </div>
                    ) : (
                        chats.map((chat) => (
                            <div
                                key={chat._id}
                                className={`modern-chat-item ${activeChat?._id === chat._id ? 'active' : ''}`}
                                onClick={() => handleSelectChat(chat._id)}
                            >
                                <div className="modern-chat-item-avatar">
                                    <FiMessageSquare />
                                </div>
                                <div className="modern-chat-item-content">
                                    <div className="modern-chat-item-top">
                                        <span className="modern-chat-item-name">
                                            {chat.order ? `Order #${chat.order._id?.slice(-8).toUpperCase()}` : 'Support'}
                                        </span>
                                        <span className="modern-chat-item-time">
                                            {formatTime(chat.lastMessage || chat.updatedAt)}
                                        </span>
                                    </div>
                                    <div className="modern-chat-item-preview">
                                        {chat.messages?.[chat.messages.length - 1]?.content?.substring(0, 55) || 'No messages'}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className={`modern-chat-window ${!showSidebar ? 'visible' : ''}`}>
                {activeChat ? (
                    <>
                        <div className="modern-chat-window-header">
                            <button className="modern-chat-back-btn" onClick={() => setShowSidebar(true)}>
                                <FiArrowLeft />
                            </button>
                            <div className="modern-chat-window-avatar">
                                <FiMessageSquare />
                            </div>
                            <div className="modern-chat-window-info">
                                <div className="modern-chat-window-name">
                                    {activeChat.order ? `Order #${activeChat.order._id?.slice(-8).toUpperCase()}` : 'Champion Support'}
                                </div>
                                <div className="modern-chat-window-status">
                                    {activeChat.status === 'active' ? 'Online' : 'Closed'}
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
                                                    <div className="modern-chat-sender">
                                                        {msg.sender?.name || 'Admin'}
                                                    </div>
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
                                    placeholder="Type a message..."
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
                        <h3>Champion Furniture Support</h3>
                        <p>Select a conversation or start a new one</p>
                        <button className="btn btn-primary" onClick={handleNewChat}>New Conversation</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;
