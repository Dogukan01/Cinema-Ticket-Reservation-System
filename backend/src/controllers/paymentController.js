const paymentService = require('../services/paymentService');

class PaymentController {
    
    /**
     * Müşterinin sepetindeki (PENDING) biletleri ödemesi için Endpoint
     */
    async pay(req, res) {
        try {
            const userId = req.user.id || null;
            const guestId = req.user.guestId || null;
            const { showtimeId, cardNumber, cvv, expiryDate } = req.body;

            if (!showtimeId || !cardNumber || !cvv || !expiryDate) {
                return res.status(400).json({ error: 'Eksik ödeme veya sipariş bilgisi.' });
            }

            const paymentResult = await paymentService.processPayment(
                userId, 
                guestId,
                showtimeId, 
                cardNumber, 
                cvv, 
                expiryDate
            );

            return res.status(200).json({
                message: 'Ödeme başarıyla alındı! Biletleriniz onaylandı.',
                ...paymentResult
            });

        } catch (error) {
            console.error('Ödeme Hatası:', error.message);
            // Kredi kartı reddedildi hatası için 402 Payment Required idealdir
            if (error.message.includes('reddedildi')) {
                return res.status(402).json({ error: error.message });
            }
            return res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new PaymentController();
