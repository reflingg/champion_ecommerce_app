import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMyChats, getChat, sendMessage, createChat } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { FiSend, FiPlus, FiMessageSquare } from 'react-icons/fi';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const ChatPage = () => {
    const { id: chatIdParam } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);

    useEffect(() => {
        socketRef.current = io(SOCKET_URL);

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
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

            return () => {
                socketRef.current.off('new-message');
            };
        }
    }, [activeChat?._id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeChat?.messages]);

    const handleSelectChat = async (chatId) => {
        try {
            const { data } = await getChat(chatId);
            setActiveChat(data);
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
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleNewChat = async () => {
        try {
            const { data } = await createChat({ content: 'Hi! I have a question about your furniture.' });
            setChats(prev => [data, ...prev]);
            setActiveChat(data);
            navigate(`/chat/${data._id}`);
        } catch (error) {
            console.error('Failed to create chat:', error);
        }
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div className="page-container" style={{ padding: '10px 20px' }}>
            <div className="chat-container">
                <div className="chat-sidebar">
                    <div className="chat-sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Conversations</span>
                        <button className="btn btn-primary btn-sm" onClick={handleNewChat}>
                            <FiPlus />
                        </button>
                    </div>
                    {chats.length === 0 ? (
                        <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-light)' }}>
                            <p>No conversations yet</p>
                            <button className="btn btn-primary btn-sm" onClick={handleNewChat} style={{ marginTop: '12px' }}>
                                Start a Chat
                            </button>
                        </div>
                    ) : (
                        chats.map((chat) => (
                            <div
                                key={chat._id}
                                className={`chat-list-item ${activeChat?._id === chat._id ? 'active' : ''}`}
                                onClick={() => handleSelectChat(chat._id)}
                            >
                                <div className="chat-name">
                                    {chat.order ? `Order #${chat.order._id?.slice(-8).toUpperCase()}` : 'General Inquiry'}
                                </div>
                                <div className="chat-preview">
                                    {chat.messages?.[chat.messages.length - 1]?.content?.substring(0, 50) || 'No messages'}
                                </div>
                                <div className="chat-time">
                                    {formatTime(chat.lastMessage || chat.updatedAt)}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="chat-main">
                    {activeChat ? (
                        <>
                            <div className="chat-header">
                                <span>
                                    {activeChat.order
                                        ? `Order #${activeChat.order._id?.slice(-8).toUpperCase()}`
                                        : 'General Inquiry'
                                    }
                                </span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                                    {activeChat.status === 'active' ? '🟢 Active' : '🔴 Closed'}
                                </span>
                            </div>

                            <div className="chat-messages">
                                {activeChat.messages?.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={`message ${msg.sender?._id === user._id || msg.sender === user._id ? 'sent' : 'received'}`}
                                    >
                                        <div className="sender-name">
                                            {msg.sender?.name || (msg.sender === user._id ? user.name : 'Admin')}
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
                                    placeholder="Type a message..."
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
                            <div style={{ textAlign: 'center' }}>
                                <FiMessageSquare style={{ fontSize: '3rem', marginBottom: '16px' }} />
                                <p>Select a conversation or start a new one</p>
                                <button className="btn btn-primary" onClick={handleNewChat} style={{ marginTop: '16px' }}>
                                    <FiPlus /> New Conversation
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
