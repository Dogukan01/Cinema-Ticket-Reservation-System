const express = require('express');
const authController = require('../controllers/authController');
const { verifyToken, requireRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Herkese açık (Public) Endpoint'ler
router.post('/register', authController.register);
router.post('/login', authController.login);

// Korumalı (Protected) Endpoint Örneği (Sadece test amaçlı)
router.get('/profile', verifyToken, (req, res) => {
    res.json({ message: 'Profil bilgileri başarıyla getirildi.', user: req.user });
});

// RBAC (Rol Kontrolü) Endpoint Örneği (Sadece Admin'ler)
router.get('/admin-dashboard', verifyToken, requireRoles('admin'), (req, res) => {
    res.json({ message: 'Admin paneline hoş geldiniz.' });
});

module.exports = router;
