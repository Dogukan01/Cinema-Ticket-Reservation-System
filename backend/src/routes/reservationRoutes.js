const express = require('express');
const reservationController = require('../controllers/reservationController');
const { extractUserOrGuest } = require('../middleware/guestMiddleware');

const router = express.Router();

// Tüm Müşterilerin görebileceği Seans Koltuk Haritası Endpoint'i
router.get('/showtimes/:showtimeId/seats', reservationController.getSeats);

// Hem Giriş Yapmış Hem Anonim Kullanıcılar
router.post('/lock', extractUserOrGuest, reservationController.lockSeat);
router.post('/unlock', extractUserOrGuest, reservationController.unlockSeat);
router.post('/reserve', extractUserOrGuest, reservationController.reserve);

module.exports = router;
