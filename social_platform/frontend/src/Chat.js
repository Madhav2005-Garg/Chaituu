import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from './api'; 

const Chat = ({ receiverId, receiverName }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [connectionError, setConnectionError] = useState(null);
    const [isConnecting, setIsConnecting] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [allMessagesRead, setAllMessagesRead] = useState(false);
    const socket = useRef(null);
    const scrollRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const authUser = localStorage.getItem('username');

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShowScrollButton(!isAtBottom);
            
            if (isAtBottom && !allMessagesRead && socket.current && socket.current.readyState === WebSocket.OPEN) {
                socket.current.send(JSON.stringify({
                    type: 'read_receipt',
                    sender: authUser
                }));
                setAllMessagesRead(true);
                console.log("📖 Sent read receipt");
            }
        }
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        if (!authUser) {
            console.error("❌ No authenticated user found");
            setConnectionError("You are not logged in");
            setIsConnecting(false);
            return;
        }

        if (!receiverName || receiverName === 'undefined' || receiverName === 'null') {
            console.error("❌ receiverName is invalid:", receiverName);
            setConnectionError("Invalid chat selection. Please try again.");
            setIsConnecting(false);
            return;
        }

        if (!receiverId) {
            console.error("❌ receiverId is undefined");
            setConnectionError("Invalid user ID");
            setIsConnecting(false);
            return;
        }

        console.log("✅ Chat initialized:", { authUser, receiverId, receiverName });
        setConnectionError(null);
        setIsConnecting(true);
        setAllMessagesRead(false);

        const fetchHistory = async () => {
            try {
                console.log(`📚 Fetching message history for: ${receiverName}`);
                const res = await api.get(`chat/messages/${receiverName}/`);
                console.log("📚 Raw history response:", res.data);
                
                const history = res.data.map(m => ({
                    sender: m.sender_username,
                    message: m.content,
                    timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }));
                setMessages(history);
                console.log("✅ History loaded from DB:", history.length, "messages");
            } catch (err) {
                console.error("❌ History load failed:", err);
                console.error("❌ Error response:", err.response);
                if (err.response?.status === 404) {
                    console.log("ℹ️ No previous messages found (404)");
                    setMessages([]);
                } else if (err.response?.status === 401) {
                    console.error("❌ Unauthorized - token might be invalid");
                    setMessages([]);
                } else {
                    console.log("ℹ️ Starting fresh conversation");
                    setMessages([]);
                }
            }
        };

        fetchHistory();

        const roomName = [authUser, receiverName].sort().join("_");
        console.log("🌐 Connecting to WebSocket room:", roomName);
        
        socket.current = new WebSocket(`ws://localhost:8000/ws/chat/${roomName}/`);

        socket.current.onopen = () => {
            console.log(`✅ WebSocket connected to room: ${roomName}`);
            setIsConnecting(false);
            setConnectionError(null);
        };

        socket.current.onmessage = (e) => {
            const data = JSON.parse(e.data);
            console.log("📩 Data received:", data);

            if (data.type === 'read_receipt') {
                if (data.reader !== authUser) {
                    console.log(`👁️ ${data.reader} has read the messages`);
                    setAllMessagesRead(true);
                }
                return;
            }

            if (data.type === 'typing') {
                if (data.sender !== authUser) {
                    setIsTyping(data.typing);
                    console.log(`⌨️ ${data.sender} is ${data.typing ? 'typing' : 'stopped typing'}`);
                }
                return;
            }

            if (data.error) {
                console.error("❌ WebSocket error:", data.error);
                setConnectionError(data.error);
                return;
            }

            if (data.message && data.sender) {
                setIsTyping(false);
                
                if (data.sender !== authUser) {
                    setAllMessagesRead(false);
                }
                
                setMessages((prev) => [...prev, { 
                    sender: data.sender, 
                    message: data.message,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);

                if (data.sender !== authUser) {
                    showMessageNotification(data.sender, data.message);
                }
            }
        };

        socket.current.onerror = (error) => {
            console.error("❌ WebSocket error:", error);
            setConnectionError("Connection error occurred");
            setIsConnecting(false);
        };

        socket.current.onclose = (event) => {
            console.warn("🔌 WebSocket disconnected. Code:", event.code, "Reason:", event.reason);
            setIsConnecting(false);
            
            if (event.code !== 1000 && event.code !== 1001) {
                setConnectionError("Connection lost. Please refresh the page.");
            }
        };

        return () => {
            if (socket.current) {
                console.log("🔌 Closing WebSocket connection");
                socket.current.close(1000);
            }
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [receiverName, receiverId, authUser]);

    const handleInputChange = (e) => {
        setInput(e.target.value);
        
        if (socket.current && socket.current.readyState === WebSocket.OPEN) {
            socket.current.send(JSON.stringify({
                type: 'typing',
                sender: authUser,
                typing: true
            }));

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                if (socket.current && socket.current.readyState === WebSocket.OPEN) {
                    socket.current.send(JSON.stringify({
                        type: 'typing',
                        sender: authUser,
                        typing: false
                    }));
                }
            }, 2000);
        }
    };

    const showMessageNotification = (sender, message) => {
        if (!("Notification" in window)) {
            console.log("Browser doesn't support notifications");
            return;
        }

        if (Notification.permission === "granted") {
            const notification = new Notification(`New message from ${sender}`, {
                body: message.length > 50 ? message.substring(0, 50) + '...' : message,
                icon: 'https://cdn-icons-png.flaticon.com/512/733/733585.png',
                badge: 'https://cdn-icons-png.flaticon.com/512/733/733585.png',
                tag: 'chat-message',
                requireInteraction: false,
                silent: false
            });

            setTimeout(() => notification.close(), 5000);

            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    showMessageNotification(sender, message);
                }
            });
        }
    };

    const sendMessage = () => {
        if (!input.trim()) {
            console.warn("Cannot send empty message");
            return;
        }

        if (!socket.current || socket.current.readyState !== WebSocket.OPEN) {
            console.error("Cannot send: WebSocket not connected");
            alert("Connection not established. Please refresh and try again.");
            return;
        }

        socket.current.send(JSON.stringify({
            type: 'typing',
            sender: authUser,
            typing: false
        }));

        const payload = { 
            type: 'message',
            message: input, 
            sender: authUser 
        };
        
        console.log("📤 Sending message:", payload);
        socket.current.send(JSON.stringify(payload));
        setInput("");
        setAllMessagesRead(false);
    };

    if (isConnecting) {
        return (
            <div style={styles.chatWrapper}>
                <header style={styles.header}>
                    <div style={styles.headerInfo}>
                        <div style={styles.avatar}>{receiverName ? receiverName[0].toUpperCase() : "?"}</div>
                        <div>
                            <h4 style={{ margin: 0, color: '#fff' }}>{receiverName}</h4>
                            <span style={styles.statusLine}>Connecting...</span>
                        </div>
                    </div>
                </header>
                <div style={styles.loadingContainer}>
                    <div style={styles.spinner}></div>
                    <p style={{ color: '#94a3b8', marginTop: '20px' }}>Establishing secure connection...</p>
                </div>
            </div>
        );
    }

    if (connectionError) {
        return (
            <div style={styles.chatWrapper}>
                <header style={styles.header}>
                    <div style={styles.headerInfo}>
                        <div style={styles.avatar}>{receiverName ? receiverName[0].toUpperCase() : "?"}</div>
                        <div>
                            <h4 style={{ margin: 0, color: '#fff' }}>{receiverName || "Unknown User"}</h4>
                            <span style={{...styles.statusLine, color: '#ef4444'}}>Connection Error</span>
                        </div>
                    </div>
                </header>
                <div style={styles.errorContainer}>
                    <div style={styles.errorIcon}>⚠️</div>
                    <h3 style={styles.errorTitle}>Connection Failed</h3>
                    <p style={styles.errorMessage}>{connectionError}</p>
                    <button 
                        style={styles.retryButton}
                        onClick={() => window.location.reload()}
                    >
                        Refresh Page
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.chatWrapper}>
            <header style={styles.header}>
                <div style={styles.headerInfo}>
                    <div style={styles.avatar}>{receiverName ? receiverName[0].toUpperCase() : "?"}</div>
                    <div>
                        <h4 style={{ margin: 0, color: '#fff' }}>{receiverName}</h4>
                        <span style={styles.statusLine}>
                            {isTyping ? '⌨️ typing...' : '🟢 Connected'}
                        </span>
                    </div>
                </div>
            </header>

            <div style={styles.messageArea} ref={scrollRef} onScroll={handleScroll}>
                <AnimatePresence initial={false}>
                    {messages.map((msg, i) => {
                        const isMe = msg.sender === authUser;
                        return (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    ...styles.bubble,
                                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                                    background: isMe ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255,255,255,0.08)',
                                    borderBottomRightRadius: isMe ? '4px' : '18px',
                                    borderBottomLeftRadius: isMe ? '18px' : '4px',
                                }}
                            >
                                <div style={styles.messageText}>{msg.message}</div>
                                <div style={styles.timeTag}>
                                    {msg.timestamp}
                                    {isMe && (
                                        <span style={{ marginLeft: '6px', fontSize: '10px' }}>
                                            {allMessagesRead ? '✓✓' : '✓'}
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                <AnimatePresence>
                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            style={{
                                ...styles.bubble,
                                alignSelf: 'flex-start',
                                background: 'rgba(255,255,255,0.08)',
                                borderBottomLeftRadius: '4px',
                                padding: '16px 20px'
                            }}
                        >
                            <div style={styles.typingDots}>
                                <motion.span 
                                    style={styles.dot}
                                    animate={{ scale: [0, 1, 0] }}
                                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                                />
                                <motion.span 
                                    style={styles.dot}
                                    animate={{ scale: [0, 1, 0] }}
                                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                                />
                                <motion.span 
                                    style={styles.dot}
                                    animate={{ scale: [0, 1, 0] }}
                                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {showScrollButton && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={scrollToBottom}
                        style={styles.scrollButton}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        ⬇️
                    </motion.button>
                )}
            </AnimatePresence>

            <div style={styles.inputContainer}>
                <div style={styles.inputBar}>
                    <input 
                        type="text" 
                        placeholder="Write a message..." 
                        style={styles.chatInput}
                        value={input}
                        onChange={handleInputChange}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={sendMessage} 
                        style={styles.sendBtn}
                    >
                        🚀
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    chatWrapper: { display: 'flex', flexDirection: 'column', height: '100%', background: '#020617' },
    header: { padding: '16px 24px', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)' },
    headerInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
    avatar: { width: '40px', height: '40px', borderRadius: '10px', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
    statusLine: { fontSize: '10px', color: '#10b981', fontWeight: 'bold' },
    messageArea: { flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' },
    bubble: { padding: '12px 16px', maxWidth: '70%', color: '#fff', borderRadius: '18px' },
    messageText: { fontSize: '14px' },
    timeTag: { fontSize: '8px', opacity: 0.5, textAlign: 'right', marginTop: '4px' },
    inputContainer: { padding: '20px' },
    inputBar: { display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '15px', padding: '5px 15px', border: '1px solid rgba(255,255,255,0.1)' },
    chatInput: { flex: 1, background: 'none', border: 'none', color: '#fff', outline: 'none', padding: '10px' },
    sendBtn: { background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer' },
    loadingContainer: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
    spinner: { width: '50px', height: '50px', border: '4px solid rgba(99, 102, 241, 0.2)', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' },
    errorContainer: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' },
    errorIcon: { fontSize: '60px', marginBottom: '20px' },
    errorTitle: { color: '#f8fafc', fontSize: '24px', marginBottom: '10px' },
    errorMessage: { color: '#94a3b8', fontSize: '14px', marginBottom: '20px', textAlign: 'center' },
    retryButton: { padding: '12px 24px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' },
    typingDots: { display: 'flex', gap: '4px', alignItems: 'center', height: '20px' },
    dot: { 
        width: '8px', 
        height: '8px', 
        borderRadius: '50%', 
        background: '#94a3b8',
        display: 'inline-block'
    },
    scrollButton: {
        position: 'fixed',
        bottom: '100px',
        right: '40px',
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        boxShadow: '0 8px 20px rgba(99, 102, 241, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    }
};

export default Chat;