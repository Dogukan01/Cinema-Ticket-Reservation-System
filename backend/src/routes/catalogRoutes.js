const express = require('express');
const catalogController = require('../controllers/catalogController');
const { verifyToken, requireRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Herkese Açık (Müşteriler filmleri görebilmeli)
router.get('/movies', catalogController.getMovies);
router.get('/movies/:id', catalogController.getMovie);

// Sadece Admin (Yönetici) Yetkisi Gerektiren İşlemler
router.post('/movies', verifyToken, requireRoles('admin'), catalogController.addMovie);
router.post('/cinemas', verifyToken, requireRoles('admin'), catalogController.addCinema);
router.post('/halls', verifyToken, requireRoles('admin'), catalogController.addHall);

// Seans Ekleme (Çakışma algoritması tetiklenir)
router.post('/showtimes', verifyToken, requireRoles('admin'), catalogController.addShowtime);

module.exports = router;
