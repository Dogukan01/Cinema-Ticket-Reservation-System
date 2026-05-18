const express = require('express');
const reservationController = require('../controllers/reservationController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Tüm Müşterilerin görebileceği Seans Koltuk Haritası Endpoint'i
router.get('/showtimes/:showtimeId/seats', reservationController.getSeats);

// Sadece Giriş Yapmış Kullanıcıların Kullanabileceği Endpoint'ler
router.post('/lock', verifyToken, reservationController.lockSeat);
router.post('/unlock', verifyToken, reservationController.unlockSeat);
router.post('/reserve', verifyToken, reservationController.reserve);

module.exports = router;
