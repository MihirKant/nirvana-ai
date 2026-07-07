import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, Video, VideoOff, Move, Save, Trash2, FolderOpen, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';
import SavedChatsSidebar from './SavedChatsSidebar';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import useCamera from '../hooks/useCamera';

const ChatInterface = () => {
    const [messages, setMessages] = useState([
        { id: 1, sender: 'system', content: '[NEUTRAL] Hello. I am Nirvana. How can I assist you today?', emotion: 'neutral' }
    ]);
    const [input, setInput] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [notification, setNotification] = useState(null);
    const [currentChatTitle, setCurrentChatTitle] = useState(null);
    const messagesEndRef = useRef(null);

    const { isListening, transcript, toggleListening, setTranscript } = useSpeechRecognition();
    const { isCameraActive, toggleCamera, videoRef } = useCamera();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (transcript) {
            setInput(transcript);
            handleSend(transcript);
        }
    }, [transcript]);

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Microsoft David'));
            if (preferredVoice) utterance.voice = preferredVoice;

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);

            window.speechSynthesis.speak(utterance);
        }
    };

    const handleSend = async (textOverride = null) => {
        const text = textOverride || input;
        if (!text.trim()) return;

        const userMsg = { id: Date.now(), sender: 'user', content: text, emotion: 'neutral' };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setTranscript('');

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            const data = await response.json();

            if (data.error) {
                setMessages(prev => [...prev, { id: Date.now(), sender: 'system', content: `Error: ${data.error}`, emotion: 'neutral' }]);
            } else {
                if (data.tool_outputs && data.tool_outputs.length > 0) {
                    data.tool_outputs.forEach((toolResult, index) => {
                        setMessages(prev => [...prev, {
                            id: Date.now() + index,
                            sender: 'system',
                            content: toolResult.output,
                            emotion: 'neutral',
                            isToolOutput: true,
                            toolName: toolResult.tool
                        }]);
                    });
                }

                let aiText = data.response;
                let emotion = 'neutral';
                const emotionMatch = aiText.match(/^\[(HAPPY|SAD|ANGRY|SURPRISED|THINKING|NEUTRAL)\]\s*(.*)/i);
                if (emotionMatch) {
                    emotion = emotionMatch[1].toLowerCase();
                    aiText = emotionMatch[2];
                }

                setMessages(prev => [...prev, {
                    id: Date.now() + 100,
                    sender: 'ai',
                    content: aiText,
                    emotion: emotion
                }]);

                speak(aiText);
            }
        } catch (err) {
            setMessages(prev => [...prev, { id: Date.now(), sender: 'system', content: `Connection Error: ${err.message}`, emotion: 'neutral' }]);
        }
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSaveChat = async (saveAs = false) => {
        let title = null;

        // If saveAs is true or no current chat, prompt for title
        if (saveAs || !currentChatTitle) {
            title = prompt('Enter a name for this chat:', currentChatTitle || '');
            if (!title) return;
        }
        // Otherwise, just update the current chat (no prompt)

        try {
            const response = await fetch('/save_chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title })
            });
            const data = await response.json();
            if (data.success) {
                setCurrentChatTitle(data.title);
                showNotification(`✅ ${data.message}`, 'success');
            } else {
                showNotification(`❌ ${data.error}`, 'error');
            }
        } catch (error) {
            showNotification(`❌ Error saving chat: ${error.message}`, 'error');
        }
    };

    const handleClearChat = async () => {
        if (!confirm('Clear current chat? (Unsaved messages will be lost)')) return;

        try {
            const response = await fetch('/clear_chat', {
                method: 'POST'
            });
            const data = await response.json();
            if (data.success) {
                setMessages([
                    { id: 1, sender: 'system', content: '[NEUTRAL] Hello. I am Nirvana. How can I assist you today?', emotion: 'neutral' }
                ]);
                setCurrentChatTitle(null);
                showNotification('🗑️ Chat cleared', 'success');
            }
        } catch (error) {
            showNotification(`❌ Error clearing chat: ${error.message}`, 'error');
        }
    };

    const handleLoadChat = async (filename) => {
        try {
            const response = await fetch('/load_chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename })
            });
            const data = await response.json();
            if (data.success) {
                // Convert loaded messages to UI format
                const uiMessages = data.messages
                    .filter(msg => msg.role !== 'system')
                    .map((msg, index) => {
                        if (msg.role === 'user' && !msg.content.startsWith('Tool Output')) {
                            return {
                                id: Date.now() + index,
                                sender: 'user',
                                content: msg.content,
                                emotion: 'neutral'
                            };
                        } else if (msg.role === 'assistant') {
                            let content = msg.content;
                            let emotion = 'neutral';
                            const emotionMatch = content.match(/^\[(HAPPY|SAD|ANGRY|SURPRISED|THINKING|NEUTRAL)\]\s*(.*)/i);
                            if (emotionMatch) {
                                emotion = emotionMatch[1].toLowerCase();
                                content = emotionMatch[2];
                            }
                            // Skip JSON tool calls
                            if (content.includes('```json')) return null;
                            return {
                                id: Date.now() + index,
                                sender: 'ai',
                                content: content,
                                emotion: emotion
                            };
                        }
                        return null;
                    })
                    .filter(msg => msg !== null);

                setMessages(uiMessages);
                setCurrentChatTitle(data.title);
                setShowSidebar(false);
                showNotification(`📂 ${data.message}`, 'success');
            }
        } catch (error) {
            showNotification(`❌ Error loading chat: ${error.message}`, 'error');
        }
    };

    return (
        <div className="container">
            {/* Saved Chats Sidebar */}
            <AnimatePresence>
                {showSidebar && (
                    <SavedChatsSidebar
                        onLoadChat={handleLoadChat}
                        onClose={() => setShowSidebar(false)}
                    />
                )}
            </AnimatePresence>

            {/* Notification Toast */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        style={{
                            position: 'fixed',
                            top: '20px',
                            right: '20px',
                            background: notification.type === 'success'
                                ? 'rgba(34, 211, 153, 0.9)'
                                : 'rgba(239, 68, 68, 0.9)',
                            color: 'white',
                            padding: '16px 24px',
                            borderRadius: '12px',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                            zIndex: 2000,
                            fontSize: '0.95rem',
                            fontWeight: 500,
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        {notification.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    padding: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(10px)',
                    borderBottom: '1px solid rgba(167, 139, 250, 0.3)',
                    borderRadius: '32px 32px 0 0'
                }}
            >
                <motion.div
                    animate={{
                        textShadow: [
                            '0 0 20px rgba(167, 139, 250, 0.8)',
                            '0 0 40px rgba(34, 211, 238, 0.8)',
                            '0 0 20px rgba(167, 139, 250, 0.8)'
                        ]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    style={{
                        fontSize: '1.8rem',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #a78bfa, #22d3ee)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '2px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start'
                    }}
                >
                    <div>Nirvana AI</div>
                    {currentChatTitle && (
                        <div style={{
                            fontSize: '0.7rem',
                            fontWeight: 400,
                            color: '#a78bfa',
                            marginTop: '4px',
                            letterSpacing: '0.5px'
                        }}>
                            {currentChatTitle}
                        </div>
                    )}
                </motion.div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleClearChat}
                        title="New Chat"
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(167, 139, 250, 0.5)',
                            color: '#a78bfa',
                            cursor: 'pointer',
                            padding: '10px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <Plus size={20} />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowSidebar(!showSidebar)}
                        title="Saved Chats"
                        style={{
                            background: showSidebar
                                ? 'linear-gradient(135deg, #a78bfa, #22d3ee)'
                                : 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(167, 139, 250, 0.5)',
                            color: 'white',
                            cursor: 'pointer',
                            padding: '10px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            boxShadow: showSidebar ? '0 0 20px rgba(167, 139, 250, 0.6)' : 'none'
                        }}
                    >
                        <FolderOpen size={20} />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleSaveChat(false)}
                        title={currentChatTitle ? `Save "${currentChatTitle}"` : "Save Chat"}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(34, 211, 153, 0.5)',
                            color: '#22d399',
                            cursor: 'pointer',
                            padding: '10px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <Save size={20} />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleCamera}
                        title="Camera"
                        style={{
                            background: isCameraActive
                                ? 'linear-gradient(135deg, #ef4444, #f87171)'
                                : 'rgba(255, 255, 255, 0.1)',
                            border: `1px solid ${isCameraActive ? '#ef4444' : 'rgba(167, 139, 250, 0.5)'}`,
                            color: 'white',
                            cursor: 'pointer',
                            padding: '10px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            boxShadow: isCameraActive ? '0 0 20px rgba(239, 68, 68, 0.6)' : 'none'
                        }}
                    >
                        {isCameraActive ? <VideoOff size={20} /> : <Video size={20} />}
                    </motion.button>
                    <div style={{
                        fontSize: '0.85rem',
                        color: '#34d399',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(52, 211, 153, 0.1)',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: '1px solid rgba(52, 211, 153, 0.3)'
                    }}>
                        <motion.span
                            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{
                                width: '8px',
                                height: '8px',
                                backgroundColor: '#34d399',
                                borderRadius: '50%',
                                boxShadow: '0 0 10px #34d399'
                            }}
                        />
                        Online
                    </div>
                </div>
            </motion.header >

            {/* Draggable Floating Camera Window */}
            < AnimatePresence >
                {isCameraActive && (
                    <motion.div
                        drag
                        dragMomentum={false}
                        dragElastic={0.1}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        style={{
                            position: 'fixed',
                            top: '100px',
                            right: '40px',
                            width: '300px',
                            background: 'rgba(0, 0, 0, 0.9)',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            border: '2px solid rgba(167, 139, 250, 0.5)',
                            boxShadow: '0 0 30px rgba(167, 139, 250, 0.4)',
                            zIndex: 1000,
                            cursor: 'grab'
                        }}
                        whileDrag={{ cursor: 'grabbing', scale: 1.02 }}
                    >
                        {/* Drag Handle */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.3), rgba(34, 211, 238, 0.3))',
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            borderBottom: '1px solid rgba(167, 139, 250, 0.3)',
                            cursor: 'grab'
                        }}>
                            <Move size={16} color="#a78bfa" />
                            <span style={{ fontSize: '0.85rem', color: '#a78bfa', fontWeight: 500 }}>Drag to move</span>
                        </div>
                        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '225px', objectFit: 'cover' }} />
                    </motion.div>
                )}
            </AnimatePresence >

            <div style={{
                flex: 1,
                padding: '24px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                position: 'relative'
            }}>
                <AnimatePresence>
                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} />
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    padding: '24px',
                    borderTop: '1px solid rgba(167, 139, 250, 0.3)',
                    display: 'flex',
                    gap: '12px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '0 0 32px 32px'
                }}
            >
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleListening}
                    animate={{
                        boxShadow: isListening
                            ? ['0 0 20px rgba(239, 68, 68, 0.6)', '0 0 40px rgba(239, 68, 68, 0.8)', '0 0 20px rgba(239, 68, 68, 0.6)']
                            : '0 0 0px transparent'
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                    style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        border: `2px solid ${isListening ? '#ef4444' : 'rgba(167, 139, 250, 0.5)'}`,
                        background: isListening
                            ? 'linear-gradient(135deg, #ef4444, #f87171)'
                            : 'rgba(255, 255, 255, 0.05)',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Mic size={24} />
                </motion.button>

                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isListening ? "Listening..." : "Hello Nirvana"}
                    className="glass-input"
                    style={{
                        flex: 1,
                        padding: '0 20px',
                        borderRadius: '16px',
                        fontSize: '1rem',
                        fontFamily: 'var(--font-family)'
                    }}
                />

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSend()}
                    style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        border: '2px solid rgba(34, 211, 238, 0.5)',
                        background: 'linear-gradient(135deg, #a78bfa, #22d3ee)',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(34, 211, 238, 0.4)'
                    }}
                >
                    <Send size={24} />
                </motion.button>
            </motion.div>
        </div >
    );
};

export default ChatInterface;
