import React, { useEffect, useState } from 'react';
import api from './api';
import { motion } from 'framer-motion';

const FriendsList = ({ onSelectUser, refreshTrigger, onlineUsers }) => {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchFriends = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('chat/friends/');
            console.log("Friends data from API:", res.data); // DEBUG
            setFriends(res.data);
        } catch (err) {
            console.error("Error fetching friends list:", err);
            setError("Failed to load friends");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFriends();
    }, [refreshTrigger]);

    if (loading) {
        return <div style={styles.empty}>Loading friends...</div>;
    }

    if (error) {
        return <div style={styles.empty}>{error}</div>;
    }

    return (
        <div style={styles.container}>
            {friends.map((friend, index) => {
                const isOnline = onlineUsers && onlineUsers[friend.username] === 'online';

                return (
                    <motion.div 
                        key={friend.id} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                        whileTap={{ scale: 0.98 }}
                        style={styles.card} 
                        onClick={() => {
                            console.log("Selecting friend:", friend); // DEBUG
                            // FIXED: Pass complete friend object with both id and username
                            onSelectUser({ 
                                id: friend.id, 
                                username: friend.username 
                            });
                        }}
                    >
                        <div style={styles.avatarWrapper}>
                            <div style={styles.avatar}>
                                {friend.username.charAt(0).toUpperCase()}
                            </div>
                            
                            <motion.div 
                                animate={{ scale: isOnline ? [1, 1.2, 1] : 1 }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                style={{
                                    ...styles.statusDot,
                                    backgroundColor: isOnline ? '#10b981' : '#475569',
                                    boxShadow: isOnline ? '0 0 10px #10b981' : 'none'
                                }}
                            />
                        </div>

                        <div style={styles.info}>
                            <div style={styles.username}>{friend.username}</div>
                            <div style={{
                                ...styles.statusText, 
                                color: isOnline ? '#10b981' : '#94a3b8' 
                            }}>
                                {isOnline ? 'Active Now' : 'Offline'}
                            </div>
                        </div>
                    </motion.div>
                );
            })}

            {friends.length === 0 && (
                <div style={styles.empty}>No friends yet. Start searching!</div>
            )}
        </div>
    );
};

const styles = {
    container: { marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' },
    card: { display: 'flex', alignItems: 'center', padding: '12px 16px', borderRadius: '16px', cursor: 'pointer', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', transition: 'border 0.2s ease' },
    avatarWrapper: { position: 'relative', marginRight: '14px' },
    avatar: { width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '18px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' },
    statusDot: { width: '12px', height: '12px', borderRadius: '50%', border: '3px solid #0f172a', position: 'absolute', bottom: '-2px', right: '-2px' },
    info: { flex: 1 },
    username: { fontWeight: '600', fontSize: '15px', color: '#f8fafc', marginBottom: '2px' },
    statusText: { fontSize: '11px', fontWeight: '500', letterSpacing: '0.3px' },
    empty: { textAlign: 'center', color: '#64748b', fontSize: '13px', marginTop: '20px' }
};

export default FriendsList;