import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach JWT token or Guest ID
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            // Clean guest ID if logged in
            config.headers['X-Guest-ID'] = undefined;
        } else {
            let guestId = localStorage.getItem('guest_id');
            if (!guestId) {
                guestId = 'guest_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
                localStorage.setItem('guest_id', guestId);
            }
            config.headers['X-Guest-ID'] = guestId;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
