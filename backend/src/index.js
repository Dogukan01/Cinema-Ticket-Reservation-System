require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./config/db');
const syncMoviesJob = require('./jobs/syncMoviesJob');
const cleanupPendingTicketsJob = require('./jobs/cleanupPendingTicketsJob');
const errorHandler = require('./middleware/errorHandler');

// Route'lar
const authRoutes = require('./routes/authRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const { Server } = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3001",
        methods: ["GET", "POST"]
    }
});

app.set('io', io); // Controllers içinde kullanmak için

io.on('connection', (socket) => {
    console.log('Yeni bir WebSocket bağlantısı:', socket.id);
    socket.on('join_showtime', (showtimeId) => {
        socket.join(`showtime_${showtimeId}`);
    });
});

const PORT = process.env.PORT || 3000;

// Güvenlik Middleware'leri
app.use(helmet()); // HTTP başlıklarını güvenli hale getirir

// Rate Limiting (Brute force & DDOS koruması)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100, // 15 dakika içinde aynı IP'den en fazla 100 istek
    message: { error: 'Çok fazla istek attınız, lütfen daha sonra tekrar deneyin.' }
});

// Middleware'ler
app.use(cors());
app.use(express.json()); // JSON body parse
app.use(express.urlencoded({ extended: true }));

// Tüm /api rotalarına rate limit uygula
app.use('/api', apiLimiter);

// API Endpoint'leri
app.use('/api/auth', authRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/payment', paymentRoutes);

// Merkezi Hata Yakalama Middleware'i
app.use(errorHandler);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'UP', message: 'SBRS Backend API çalışıyor.' });
});

// Ana Sayfa (Root Route)
app.get('/', (req, res) => {
    res.send('<h1>SBRS Backend API Çalışıyor!</h1><p>API endpointleri için /api/ yolunu kullanın.</p>');
});

// Veritabanı bağlantı testi ve Sunucuyu başlatma
async function startServer() {
    try {
        await db.query('SELECT NOW()');
        console.log('✅ PostgreSQL Veritabanı Bağlantısı Başarılı!');
        
        // Cron Job'ları başlat
        syncMoviesJob.start();
        cleanupPendingTicketsJob.start();
        
        // Sunucuyu başlat
        server.listen(PORT, () => {
            console.log(`🚀 SBRS Sunucusu http://localhost:${PORT} portunda çalışıyor.`);
        });
    } catch (error) {
        console.error('❌ Sunucu başlatılamadı. Veritabanı bağlantı hatası:', error.message);
        process.exit(1);
    }
}

startServer();
