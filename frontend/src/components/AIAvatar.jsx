import React from 'react';
import { motion } from 'framer-motion';

const AIAvatar = ({ isListening, isSpeaking }) => {
    return (
        <div className="ai-avatar-container" style={{
            position: 'relative',
            width: '120px',
            height: '120px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '0 auto 20px auto'
        }}>
            {/* Core Orb */}
            <motion.div
                animate={{
                    scale: isSpeaking ? [1, 1.2, 1] : isListening ? [1, 1.1, 1] : [1, 1.05, 1],
                    boxShadow: isSpeaking
                        ? "0 0 50px 20px rgba(139, 92, 246, 0.6)"
                        : isListening
                            ? "0 0 40px 10px rgba(239, 68, 68, 0.5)"
                            : "0 0 30px 5px rgba(139, 92, 246, 0.3)"
                }}
                transition={{
                    duration: isSpeaking ? 0.5 : 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: isListening
                        ? 'linear-gradient(135deg, #ef4444, #f87171)'
                        : 'linear-gradient(135deg, #8b5cf6, #d8b4fe)',
                    zIndex: 2
                }}
            />

            {/* Outer Rings */}
            <motion.div
                animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 0, 0.5],
                    rotate: 360
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                }}
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '2px solid rgba(139, 92, 246, 0.2)',
                    borderTopColor: 'rgba(139, 92, 246, 0.8)',
                    zIndex: 1
                }}
            />
            <motion.div
                animate={{
                    scale: [1.2, 1.8, 1.2],
                    opacity: [0.3, 0, 0.3],
                    rotate: -360
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear"
                }}
                style={{
                    position: 'absolute',
                    width: '80%',
                    height: '80%',
                    borderRadius: '50%',
                    border: '2px dashed rgba(139, 92, 246, 0.2)',
                    zIndex: 1
                }}
            />
        </div>
    );
};

export default AIAvatar;
