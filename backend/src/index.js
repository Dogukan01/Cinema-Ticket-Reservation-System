require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const syncMoviesJob = require('./jobs/syncMoviesJob');

// Route'lar
const authRoutes = require('./routes/authRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware'ler
app.use(cors());
app.use(express.json()); // JSON body parse
app.use(express.urlencoded({ extended: true }));

// API Endpoint'leri
app.use('/api/auth', authRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/payment', paymentRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'UP', message: 'SBRS Backend API çalışıyor.' });
});

// Veritabanı bağlantı testi ve Sunucuyu başlatma
async function startServer() {
    try {
        await db.query('SELECT NOW()');
        console.log('✅ PostgreSQL Veritabanı Bağlantısı Başarılı!');
        
        // Cron Job'ları başlat
        syncMoviesJob.start();
        
        app.listen(PORT, () => {
            console.log(`🚀 SBRS Sunucusu http://localhost:${PORT} portunda çalışıyor.`);
        });
    } catch (error) {
        console.error('❌ Sunucu başlatılamadı. Veritabanı bağlantı hatası:', error.message);
        process.exit(1);
    }
}

startServer();
