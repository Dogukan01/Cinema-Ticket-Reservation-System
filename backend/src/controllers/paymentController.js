const paymentService = require('../services/paymentService');
const { sendTicketEmail } = require('../utils/mailer');

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

            // E-posta gönderimi
            if (req.user && req.user.email) {
                const userName = req.user.email.split('@')[0];
                const ticketDetails = {
                    ticketIds: paymentResult.confirmedTickets,
                    totalAmount: paymentResult.totalAmount
                };
                
                sendTicketEmail(req.user.email, userName, ticketDetails).catch(err => {
                    console.error('Mail gönderim hatası:', err.message);
                });
            }

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

    /**
     * Ödenen biletlerin detaylı fatura bilgilerini getirir
     */
    async getInvoice(req, res) {
        try {
            const userId = req.user.id || null;
            const guestId = req.user.guestId || null;
            const { showtimeId } = req.params;

            if (!showtimeId) {
                return res.status(400).json({ error: 'showtimeId parametresi zorunludur.' });
            }

            const invoiceDetails = await paymentService.getInvoiceDetails(userId, guestId, showtimeId);

            return res.status(200).json(invoiceDetails);

        } catch (error) {
            console.error('Fatura Bilgisi Hatası:', error.message);
            return res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new PaymentController();
