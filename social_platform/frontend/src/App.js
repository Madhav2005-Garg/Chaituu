import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './Login';
import Register from './Register';
import UserSearch from './UserSearch';
import Chat from './Chat';
import FriendsList from './FriendsList';

function App() {
  // FIXED: Initialize from localStorage properly
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [refreshFriends, setRefreshFriends] = useState(0);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    console.log("Auth check:", { token: !!token, username });
    
    if (token && username) {
      setAuthUser(username);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    console.log("Active chat changed:", activeChat);
    if (activeChat) {
      console.log("Active chat has:", {
        id: activeChat.id,
        username: activeChat.username
      });
    }
  }, [activeChat]);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications.");
      return;
    }

    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
       alert("Security Error: Notifications only work over HTTPS or Localhost.");
       return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        new Notification("Success!", {
          body: "Real-time alerts are now active.",
          icon: "https://cdn-icons-png.flaticon.com/512/733/733585.png"
        });
      } else if (permission === "denied") {
        alert("Permission Denied. Please reset permissions in your browser settings.");
      }
    } catch (error) {
      console.error("Notification permission error:", error);
    }
  };

  useEffect(() => {
    if (!authUser) return;
    
    console.log("Connecting status socket for:", authUser);
    const statusSocket = new WebSocket(`ws://localhost:8000/ws/status/${authUser}/`);

    statusSocket.onopen = () => {
      console.log("Status WebSocket connected");
    };

    statusSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setOnlineUsers(prev => ({ ...prev, [data.user]: data.status }));

      if (data.status === 'online' && data.user !== authUser) {
        if (Notification.permission === "granted") {
          new Notification("New Activity", {
            body: `${data.user} is now online!`,
            icon: "https://cdn-icons-png.flaticon.com/512/733/733585.png" 
          });
        }
      }
    };

    statusSocket.onerror = (error) => {
      console.error("Status WebSocket error:", error);
    };

    statusSocket.onclose = () => {
      console.log("Status WebSocket closed");
    };

    return () => {
      console.log("Cleaning up status socket");
      statusSocket.close();
    };
  }, [authUser]);

  const handleLogout = () => {
    console.log("Logging out...");
    localStorage.clear();
    setAuthUser(null);
    window.location.reload();
  };

  // Show loading state
  if (loading) {
    return (
      <div style={styles.authWrapper}>
        <div style={{ color: '#fff' }}>Loading...</div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div style={styles.authWrapper}>
        <AnimatePresence mode="wait">
          {showRegister ? <Register key="reg" /> : <Login key="log" setAuthUser={setAuthUser} />}
        </AnimatePresence>
        <button onClick={() => setShowRegister(!showRegister)} style={styles.floatingToggle}>
          {showRegister ? "Already have an account? Sign In" : "Need an account? Sign Up"}
        </button>
      </div>
    );
  }

  return (
    <div style={styles.dashboard}>
      <motion.nav initial={{ x: -80 }} animate={{ x: 0 }} style={styles.navRail}>
        <div style={styles.logoBox}>S</div>
        <div style={styles.navLinks}>
          <div style={styles.activeIcon} title="Chats">💬</div>
          <div style={styles.icon} title="Friends">👥</div>
          <div style={styles.icon} title="Settings">⚙️</div>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>LOGOUT</button>
      </motion.nav>

      <motion.aside initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.sidebar}>
        <header style={styles.sideHeader}>
          <div style={styles.userProfile}>
             <div style={styles.avatarSmall}>{authUser[0].toUpperCase()}</div>
             <div style={styles.userMeta}>
               <span style={styles.welcomeText}>Logged in as</span>
               <h4 style={styles.currentUserName}>{authUser}</h4>
             </div>
             <button 
                onClick={requestNotificationPermission} 
                style={styles.notifyBtn}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
             >
               🔔
             </button>
          </div>
          
          <h2 style={styles.title}>Messages</h2>
          <UserSearch onSelectUser={setActiveChat} />
        </header>

        <div style={styles.friendsContainer}>
          <FriendsList 
            onSelectUser={setActiveChat} 
            onlineUsers={onlineUsers} 
            refreshTrigger={refreshFriends}
          />
        </div>
      </motion.aside>

      <main style={styles.mainView}>
        {activeChat && activeChat.username ? (
          <Chat receiverId={activeChat.id} receiverName={activeChat.username} />
        ) : (
          <div style={styles.emptyState}>
            <div style={{fontSize: '50px', marginBottom: '10px'}}>✨</div>
            <h3>Pick a friend to chat</h3>
            <p style={{color: '#64748b'}}>Secure real-time encrypted messaging</p>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  dashboard: { display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#020617' },
  authWrapper: { width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#020617' },
  navRail: { width: '80px', background: '#0f172a', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '25px 0' },
  logoBox: { width: '45px', height: '45px', background: '#6366f1', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', marginBottom: '40px' },
  navLinks: { flex: 1, display: 'flex', flexDirection: 'column', gap: '30px' },
  activeIcon: { fontSize: '24px', background: '#1e293b', padding: '12px', borderRadius: '15px' },
  icon: { fontSize: '24px', opacity: 0.5, cursor: 'pointer' },
  logoutBtn: { border: 'none', background: 'none', color: '#ef4444', fontWeight: '800', cursor: 'pointer', fontSize: '10px', marginTop: 'auto' },
  sidebar: { width: '360px', background: '#020617', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column' },
  sideHeader: { padding: '30px 25px' },
  userProfile: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '15px' },
  avatarSmall: { width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff' },
  userMeta: { display: 'flex', flexDirection: 'column' },
  welcomeText: { fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' },
  currentUserName: { margin: 0, fontSize: '16px', color: '#fff' },
  notifyBtn: { marginLeft: 'auto', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', transition: '0.3s', fontSize: '16px' },
  title: { fontSize: '26px', fontWeight: '700', marginBottom: '20px', color: '#fff' },
  friendsContainer: { flex: 1, overflowY: 'auto', padding: '0 15px' },
  mainView: { flex: 1, background: '#0f172a' },
  emptyState: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  floatingToggle: { position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', textDecoration: 'underline' }
};

export default App;