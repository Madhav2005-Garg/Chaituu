import React, { useState } from 'react';
import api from './api'; 

const UserSearch = ({ onSelectUser }) => {
    const [searchResults, setSearchResults] = useState([]);
    const [query, setQuery] = useState("");

    const handleSearch = async (e) => {
        const value = e.target.value;
        setQuery(value);

        if (value.length > 1) {
            try {
                const res = await api.get(`users/?search=${value}`);
                console.log("Search results:", res.data); // DEBUG
                setSearchResults(res.data);
            } catch (err) {
                console.error("Search failed:", err);
            }
        } else {
            setSearchResults([]);
        }
    };

    return (
        <div style={styles.searchContainer}>
            <input 
                type="text" 
                placeholder="Search people..." 
                style={styles.input}
                value={query}
                onChange={handleSearch}
            />
            <div style={styles.resultsList}>
                {searchResults.map((user) => (
                    <div 
                        key={user.id} 
                        style={styles.userRow}
                        onClick={() => {
                            console.log("Selecting user from search:", user); // DEBUG
                            // FIXED: Ensure both id and username are passed
                            onSelectUser({
                                id: user.id,
                                username: user.username
                            });
                            setQuery("");
                            setSearchResults([]);
                        }}
                    >
                        <div style={styles.avatar}>{user.username[0].toUpperCase()}</div>
                        {user.username}
                    </div>
                ))}
            </div>
        </div>
    );
};

const styles = {
    searchContainer: { padding: '15px', borderBottom: '1px solid #1e293b' },
    input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#fff' },
    resultsList: { marginTop: '10px' },
    userRow: { padding: '8px', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', cursor: 'pointer' },
    avatar: { width: '30px', height: '30px', borderRadius: '50%', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }
};

export default UserSearch;