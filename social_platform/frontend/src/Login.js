import React, { useState } from 'react';
import api from './api';

const Login = ({ setAuthUser }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        
        try {
            const res = await api.post('login/', { username, password });
            
            console.log("Login response:", res.data);
            
            // CRITICAL: Check if token exists in response
            if (!res.data.token) {
                throw new Error("No token received from server");
            }
            
            // Save token and username
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('username', username);
            
            console.log("Token saved:", localStorage.getItem('token'));
            console.log("Username saved:", localStorage.getItem('username'));
            
            // Set auth user
            setAuthUser(username);
            
            // Reload after small delay
            setTimeout(() => {
                window.location.reload();
            }, 200);
            
        } catch (err) {
            console.error("Login failed:", err);
            setError(err.response?.data?.error || err.message || "Invalid credentials");
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleLogin} style={styles.form}>
            <h2 style={styles.title}>Welcome Back</h2>
            {error && <div style={styles.error}>{error}</div>}
            <input 
                type="text" 
                placeholder="Username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.input}
                required
                disabled={loading}
            />
            <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
                disabled={loading}
            />
            <button type="submit" style={styles.button} disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
            </button>
        </form>
    );
};

const styles = {
    form: { background: '#1e293b', padding: '40px', borderRadius: '20px', width: '400px' },
    title: { color: '#fff', marginBottom: '30px', textAlign: 'center' },
    input: { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '10px', border: 'none', background: '#0f172a', color: '#fff' },
    button: { width: '100%', padding: '12px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
    error: { background: '#ef4444', color: '#fff', padding: '10px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center', fontSize: '14px' }
};

export default Login;