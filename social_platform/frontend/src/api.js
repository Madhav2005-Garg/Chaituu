import axios from 'axios';

const api = axios.create({
    baseURL: `${process.env.REACT_APP_API_URL}/api/`,
});

// CRITICAL: Add token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        console.log("API Request - Token:", token ? "EXISTS" : "MISSING");
        
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.error("401 Unauthorized - Token invalid or missing");
            // Don't auto-logout immediately, just log the error
        }
        return Promise.reject(error);
    }
);

export default api;