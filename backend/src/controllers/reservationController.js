const reservationService = require('../services/reservationService');
const seatLockService = require('../services/seatLockService');

class ReservationController {
    
    /**
     * Bir seansa ait salon yapısını ve satılmamış/kilitlenmemiş BOŞ koltukları getirir.
     */
    async getSeats(req, res) {
        try {
            const { showtimeId } = req.params;
            const data = await reservationService.getAvailableSeats(showtimeId);
            return res.status(200).json(data);
        } catch (error) {
            console.error('Koltukları getirme hatası:', error.message);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Önceden yazdığımız Redis Koltuk Kilitleme fonksiyonunu çağırır. (Epic 1'deki taslak)
     */
    async lockSeat(req, res) {
        try {
            const { showtimeId, seatId } = req.body;
            const userId = req.user.identifier;

            if (!showtimeId || !seatId) return res.status(400).json({ error: 'showtimeId ve seatId zorunludur.' });

            const isLocked = await seatLockService.lockSeat(showtimeId, seatId, userId);
            
            if (isLocked) {
                return res.status(200).json({ message: 'Koltuk sizin için 10 dakikalığına ayrıldı.', expiresIn: 600 });
            } else {
                return res.status(409).json({ error: 'Koltuk şu anda başka bir kullanıcı tarafından işlem görüyor.' });
            }
        } catch (error) {
            return res.status(500).json({ error: 'Sunucu hatası.' });
        }
    }

    /**
     * Redis koltuk kilidini geri açar (İptal durumu).
     */
    async unlockSeat(req, res) {
        try {
            const { showtimeId, seatId } = req.body;
            const userId = req.user.identifier;
            
            const isUnlocked = await seatLockService.unlockSeat(showtimeId, seatId, userId);
            if (isUnlocked) {
                return res.status(200).json({ message: 'Koltuk kilidi açıldı.' });
            } else {
                return res.status(403).json({ error: 'Bu koltuğun kilidini açma yetkiniz yok veya süre zaten dolmuş.' });
            }
        } catch (error) {
            return res.status(500).json({ error: 'Sunucu hatası.' });
        }
    }

    /**
     * Kilitlenen koltukları kalıcı PENDING biletine çevirir (Ödeme adımı öncesi).
     */
    async reserve(req, res) {
        try {
            const { showtimeId, seatSelections } = req.body;
            const identifier = req.user.identifier;
            const userId   = req.user.isGuest ? null : req.user.id;
            const guestId  = req.user.isGuest ? req.user.guestId : null;

            if (!showtimeId || !seatSelections) {
                return res.status(400).json({ error: 'showtimeId ve seatSelections (array) zorunludur.' });
            }

            const tickets = await reservationService.reserveTickets(identifier, userId, guestId, showtimeId, seatSelections);
            
            return res.status(201).json({
                message: 'Biletler başarıyla PENDING statüsünde ayrıldı. Lütfen ödemeyi tamamlayın.',
                tickets
            });
        } catch (error) {
            console.error('Rezervasyon Hatası:', error.message);
            return res.status(400).json({ error: error.message });
        }
    }

    /**
     * Kullanıcının bir seans için PENDING biletlerini iptal eder (checkout'tan geri dönüş).
     */
    async cancelPending(req, res) {
        try {
            const { showtimeId } = req.body;
            const identifier = req.user.identifier;
            const userId   = req.user.isGuest ? null : req.user.id;
            const guestId  = req.user.isGuest ? req.user.guestId : null;

            if (!showtimeId) return res.status(400).json({ error: 'showtimeId zorunludur.' });

            const cancelledSeats = await reservationService.cancelPendingTickets(identifier, userId, guestId, showtimeId);
            return res.status(200).json({ message: 'PENDING biletler iptal edildi.', cancelledSeats });
        } catch (error) {
            console.error('Cancel pending hatası:', error.message);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Satın alınmış bileti iptal eder ve iadesini gerçekleştirir.
     */
    async cancelTicket(req, res) {
        try {
            const { ticketId } = req.params;
            const userId = req.user.id;

            if (!ticketId) {
                return res.status(400).json({ error: 'ticketId zorunludur.' });
            }

            const result = await reservationService.cancelTicket(userId, ticketId);
            return res.status(200).json({
                message: 'Biletiniz başarıyla iptal edildi ve ücret iadeniz yapıldı.',
                result
            });
        } catch (error) {
            console.error('Bilet İptal Hatası:', error.message);
            return res.status(400).json({ error: error.message });
        }
    }
}

module.exports = new ReservationController();
