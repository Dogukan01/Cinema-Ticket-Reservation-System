import axios from 'axios';

// Backend'in çalıştığı URL'i ayarlıyoruz (Şimdilik Localhost)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Eğer localStorage'da JWT varsa, her isteğin Header'ına otomatik ekle
api.interceptors.request.use(
    (config) => {
        // Tarayıcı ortamında mıyız kontrolü (Next.js SSR sırasında patlamamak için)
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
