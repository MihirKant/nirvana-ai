import React, { useState, useEffect } from 'react';
import { Save, Trash2, FolderOpen, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SavedChatsSidebar = ({ onLoadChat, onClose }) => {
    const [savedChats, setSavedChats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSavedChats();
    }, []);

    const loadSavedChats = async () => {
        try {
            const response = await fetch('/list_chats');
            const data = await response.json();
            setSavedChats(data.chats || []);
        } catch (error) {
            console.error('Error loading chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (filename, e) => {
        e.stopPropagation();
        if (!confirm('Delete this chat?')) return;

        try {
            await fetch('/delete_chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename })
            });
            loadSavedChats();
        } catch (error) {
            console.error('Error deleting chat:', error);
        }
    };

    return (
        <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            style={{
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                width: '320px',
                background: 'rgba(0, 0, 0, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRight: '1px solid rgba(167, 139, 250, 0.3)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                padding: '20px'
            }}
        >
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <h2 style={{
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #a78bfa, #22d3ee)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Saved Chats
                </h2>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(167, 139, 250, 0.3)',
                        color: 'white',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <X size={18} />
                </motion.button>
            </div>

            <div style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}>
                {loading ? (
                    <div style={{ color: '#a78bfa', textAlign: 'center', padding: '20px' }}>
                        Loading...
                    </div>
                ) : savedChats.length === 0 ? (
                    <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                        No saved chats yet
                    </div>
                ) : (
                    savedChats.map((chat) => (
                        <motion.div
                            key={chat.filename}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => onLoadChat(chat.filename)}
                            style={{
                                background: 'rgba(167, 139, 250, 0.1)',
                                border: '1px solid rgba(167, 139, 250, 0.3)',
                                borderRadius: '12px',
                                padding: '12px',
                                cursor: 'pointer',
                                position: 'relative'
                            }}
                        >
                            <div style={{
                                fontSize: '0.95rem',
                                fontWeight: 500,
                                color: 'white',
                                marginBottom: '6px',
                                paddingRight: '30px'
                            }}>
                                {chat.title}
                            </div>
                            <div style={{
                                fontSize: '0.75rem',
                                color: '#888',
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}>
                                <span>{chat.message_count} messages</span>
                                <span>{new Date(chat.timestamp).toLocaleDateString()}</span>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => handleDelete(chat.filename, e)}
                                style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    border: '1px solid rgba(239, 68, 68, 0.5)',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                <Trash2 size={14} />
                            </motion.button>
                        </motion.div>
                    ))
                )}
            </div>
        </motion.div>
    );
};

export default SavedChatsSidebar;
