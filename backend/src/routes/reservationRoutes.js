const express = require('express');
const reservationController = require('../controllers/reservationController');
const { extractUserOrGuest } = require('../middleware/guestMiddleware');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Tüm Müşterilerin görebileceği Seans Koltuk Haritası Endpoint'i
router.get('/showtimes/:showtimeId/seats', reservationController.getSeats);

// Hem Giriş Yapmış Hem Anonim Kullanıcılar
router.post('/lock', extractUserOrGuest, reservationController.lockSeat);
router.post('/unlock', extractUserOrGuest, reservationController.unlockSeat);
router.post('/reserve', extractUserOrGuest, reservationController.reserve);
router.post('/cancel-pending', extractUserOrGuest, reservationController.cancelPending);

// Sadece Giriş Yapmış Kullanıcılar İçin Bilet İptali
router.post('/cancel/:ticketId', verifyToken, reservationController.cancelTicket);

module.exports = router;
