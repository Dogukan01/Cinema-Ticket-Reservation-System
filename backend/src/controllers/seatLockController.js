const seatLockService = require('../services/seatLockService');

class SeatLockController {
  
  /**
   * Kullanıcının koltuk seçme (kilitleme) isteğini işler.
   */
  async lockSeat(req, res) {
    try {
      const { showtimeId, seatId } = req.body;
      const userId = req.user.id; // Authentication middleware'inden geleceği varsayılır

      if (!showtimeId || !seatId) {
        return res.status(400).json({ error: 'showtimeId ve seatId zorunludur.' });
      }

      const isLocked = await seatLockService.lockSeat(showtimeId, seatId, userId);

      if (isLocked) {
        const io = req.app.get('io');
        if (io) {
            io.to(`showtime_${showtimeId}`).emit('seat_locked', { seatId });
        }
        return res.status(200).json({ message: 'Koltuk başarıyla kilitlendi.', expiresIn: 600 });
      } else {
        return res.status(409).json({ error: 'Koltuk şu anda başka bir kullanıcı tarafından işlem görüyor (kilitli).' });
      }
    } catch (error) {
      console.error('Koltuk kilitleme hatası:', error);
      return res.status(500).json({ error: 'Sunucu hatası oluştu.' });
    }
  }

  /**
   * Kullanıcının koltuk kilidini açma isteğini işler.
   */
  async unlockSeat(req, res) {
    try {
      const { showtimeId, seatId } = req.body;
      const userId = req.user.id; // Authentication middleware'inden geleceği varsayılır

      if (!showtimeId || !seatId) {
        return res.status(400).json({ error: 'showtimeId ve seatId zorunludur.' });
      }

      const isUnlocked = await seatLockService.unlockSeat(showtimeId, seatId, userId);

      if (isUnlocked) {
        const io = req.app.get('io');
        if (io) {
            io.to(`showtime_${showtimeId}`).emit('seat_unlocked', { seatId });
        }
        return res.status(200).json({ message: 'Koltuk kilidi başarıyla açıldı.' });
      } else {
        return res.status(403).json({ error: 'Bu koltuğun kilidini açma yetkiniz yok veya kilit süresi dolmuş.' });
      }
    } catch (error) {
      console.error('Koltuk kilit açma hatası:', error);
      return res.status(500).json({ error: 'Sunucu hatası oluştu.' });
    }
  }
}

module.exports = new SeatLockController();
