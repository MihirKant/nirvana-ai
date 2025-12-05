import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import ToolOutput from './ToolOutput';

const MessageBubble = ({ message }) => {
    const { sender, content, emotion, isToolOutput, toolName } = message;

    const emotionColors = {
        happy: '#34d399',
        sad: '#60a5fa',
        angry: '#f87171',
        surprised: '#fbbf24',
        thinking: '#c084fc',
        neutral: '#a78bfa'
    };

    const accentColor = emotionColors[emotion] || emotionColors.neutral;

    if (isToolOutput) {
        return (
            <motion.div
                initial={{ opacity: 0, x: -30, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                style={{ alignSelf: 'flex-start', maxWidth: '90%', marginBottom: '12px' }}
            >
                <div style={{
                    padding: '20px',
                    borderRadius: '20px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(10px)',
                    border: `2px solid ${accentColor}40`,
                    boxShadow: `0 0 30px ${accentColor}20`,
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                        animation: 'shimmer 2s ease-in-out infinite'
                    }} />
                    <ToolOutput toolName={toolName} output={content} />
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            style={{
                display: 'flex',
                maxWidth: '80%',
                alignSelf: sender === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '12px'
            }}
        >
            <div style={{
                padding: '16px 24px',
                borderRadius: '24px',
                fontSize: '1rem',
                lineHeight: 1.6,
                background: sender === 'user'
                    ? 'linear-gradient(135deg, rgba(167, 139, 250, 0.3), rgba(34, 211, 238, 0.3))'
                    : 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                border: sender === 'user'
                    ? '2px solid rgba(167, 139, 250, 0.5)'
                    : `2px solid ${accentColor}40`,
                boxShadow: sender === 'user'
                    ? '0 0 30px rgba(167, 139, 250, 0.3)'
                    : `0 0 20px ${accentColor}20`,
                position: 'relative',
                overflow: 'hidden'
            }}>
                {sender === 'ai' && (
                    <motion.div
                        animate={{
                            x: ['-100%', '200%'],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '50%',
                            height: '100%',
                            background: `linear-gradient(90deg, transparent, ${accentColor}30, transparent)`,
                            pointerEvents: 'none'
                        }}
                    />
                )}
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        code({ node, inline, className, children, ...props }) {
                            return !inline ? (
                                <pre style={{
                                    background: 'rgba(0,0,0,0.5)',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    overflowX: 'auto',
                                    border: '1px solid rgba(167, 139, 250, 0.3)',
                                    marginTop: '8px'
                                }}>
                                    <code {...props} className={className}>
                                        {children}
                                    </code>
                                </pre>
                            ) : (
                                <code {...props} className={className} style={{
                                    background: 'rgba(167, 139, 250, 0.2)',
                                    padding: '2px 6px',
                                    borderRadius: '6px',
                                    fontSize: '0.9em',
                                    border: '1px solid rgba(167, 139, 250, 0.3)'
                                }}>
                                    {children}
                                </code>
                            )
                        }
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>
        </motion.div>
    );
};

export default MessageBubble;
