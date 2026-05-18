const express = require('express');
const paymentController = require('../controllers/paymentController');
const { extractUserOrGuest } = require('../middleware/guestMiddleware');

const router = express.Router();

// Hem Giriş Yapmış Hem Anonim Kullanıcılar
router.post('/pay', extractUserOrGuest, paymentController.pay);

module.exports = router;
