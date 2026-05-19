const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireRoles } = require('../middleware/authMiddleware');

// Tüm admin rotaları için Authentication ve Admin yetkisi zorunludur
router.use(verifyToken, requireRoles('admin'));

// Müşterileri listele
router.get('/customers', adminController.getCustomers);

// Satışları ve istatistikleri getir
router.get('/sales', adminController.getSalesStats);

module.exports = router;
