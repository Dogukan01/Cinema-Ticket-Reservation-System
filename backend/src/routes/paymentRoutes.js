const express = require('express');
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Sadece Giriş Yapmış Kullanıcıların Kullanabileceği Endpoint
router.post('/pay', verifyToken, paymentController.pay);

module.exports = router;
