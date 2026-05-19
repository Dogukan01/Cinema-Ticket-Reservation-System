const db = require('../config/db');
const redis = require('../config/redis');

class PaymentService {
    /**
     * Müşterinin PENDING statüsündeki biletlerini bulur ve "Mock" bir ödeme işlemi gerçekleştirir.
     */
    async processPayment(userId, guestId, showtimeId, cardNumber, cvv, expiryDate) {
        // 1. Kullanıcının PENDING biletlerini bul
        let pendingResult;
        
        if (userId) {
            pendingResult = await db.query(
                "SELECT id, seat_id FROM tickets WHERE user_id = $1 AND showtime_id = $2 AND status = 'PENDING'",
                [userId, showtimeId]
            );
        } else if (guestId) {
            pendingResult = await db.query(
                "SELECT id, seat_id FROM tickets WHERE guest_id = $1 AND showtime_id = $2 AND status = 'PENDING'",
                [guestId, showtimeId]
            );
        } else {
            throw new Error('Kimlik bilgisi bulunamadı.');
        }

        if (pendingResult.rows.length === 0) {
            throw new Error('Ödenecek bilet (sepet) bulunamadı veya 10 dakikalık süreniz doldu.');
        }

        const pendingTickets = pendingResult.rows;

        // 2. Mock Ödeme Mantığı (İyzico / Stripe simülasyonu)
        // Eğer kredi kartı numarası 4242 4242 4242 4242 (Boşluksuz 4242424242424242) ise ödeme başarılıdır.
        const cleanCardNumber = cardNumber.replace(/\s+/g, '');
        const isPaymentSuccessful = cleanCardNumber === '4242424242424242';

        if (!isPaymentSuccessful) {
            // Önerildiği gibi, başarısız işlemde biletleri (PENDING) iptal etmiyoruz,
            // 10 dakika dolana kadar tekrar denemesine izin veriyoruz.
            throw new Error('Ödeme reddedildi! Lütfen limitinizi kontrol edip tekrar deneyin.');
        }

        // 3. Ödeme Başarılıysa Transaction (İşlem Bloğu) başlat
        const dbClient = await db.pool.connect();
        await redis.connect();
        const redisClient = redis.getClient();

        try {
            await dbClient.query('BEGIN');

            const ticketIds = pendingTickets.map(t => t.id);
            const seatIds = pendingTickets.map(t => t.seat_id);

            // Bilet statülerini CONFIRMED yap
            const updateQuery = `
                UPDATE tickets 
                SET status = 'CONFIRMED', updated_at = NOW() 
                WHERE id = ANY($1::uuid[]) 
                RETURNING id, seat_id, price
            `;
            const confirmedResult = await dbClient.query(updateQuery, [ticketIds]);

            // Redis kilitlerini KALICI olarak temizle (Artık koltuklar tamamen satıldı)
            for (const seatId of seatIds) {
                const lockKey = `seat_lock:${showtimeId}:${seatId}`;
                await redisClient.del(lockKey);
            }

            await dbClient.query('COMMIT');

            // Fatura/Makbuz Numarası oluştur (Sahte)
            const receiptId = 'TRX-' + Math.random().toString(36).substr(2, 9).toUpperCase();

            return {
                receiptId: receiptId,
                confirmedTickets: confirmedResult.rows
            };

        } catch (error) {
            await dbClient.query('ROLLBACK');
            throw error;
        } finally {
            dbClient.release();
        }
    }

    /**
     * Ödenen biletlerin detaylı fatura bilgilerini getirir
     * (Film, seans, sinema, koltuk vb. bilgileri)
     */
    async getInvoiceDetails(userId, guestId, showtimeId) {
        // CONFIRMED statüsündeki biletleri al
        let ticketsResult;
        
        if (userId) {
            ticketsResult = await db.query(
                `SELECT t.*, s.start_time, s.price as showtime_price,
                        m.title as movie_title, m.duration_minutes, m.poster_url,
                        c.name as cinema_name, c.location as cinema_location,
                        h.name as hall_name
                 FROM tickets t
                 JOIN showtimes s ON t.showtime_id = s.id
                 JOIN movies m ON s.movie_id = m.id
                 JOIN halls h ON s.hall_id = h.id
                 JOIN cinemas c ON h.cinema_id = c.id
                 WHERE t.user_id = $1 AND t.showtime_id = $2 AND t.status = 'CONFIRMED'
                 ORDER BY t.created_at DESC`,
                [userId, showtimeId]
            );
        } else if (guestId) {
            ticketsResult = await db.query(
                `SELECT t.*, s.start_time, s.price as showtime_price,
                        m.title as movie_title, m.duration_minutes, m.poster_url,
                        c.name as cinema_name, c.location as cinema_location,
                        h.name as hall_name
                 FROM tickets t
                 JOIN showtimes s ON t.showtime_id = s.id
                 JOIN movies m ON s.movie_id = m.id
                 JOIN halls h ON s.hall_id = h.id
                 JOIN cinemas c ON h.cinema_id = c.id
                 WHERE t.guest_id = $1 AND t.showtime_id = $2 AND t.status = 'CONFIRMED'
                 ORDER BY t.created_at DESC`,
                [guestId, showtimeId]
            );
        } else {
            throw new Error('Kimlik bilgisi bulunamadı.');
        }

        if (ticketsResult.rows.length === 0) {
            throw new Error('Fatura bilgisi bulunamadı.');
        }

        const tickets = ticketsResult.rows;
        const firstTicket = tickets[0];

        // Toplam fiyat hesapla
        const totalPrice = tickets.reduce((sum, ticket) => sum + parseFloat(ticket.price), 0);

        return {
            invoiceDate: new Date().toISOString(),
            movieTitle: firstTicket.movie_title,
            movieDuration: firstTicket.duration_minutes,
            moviePoster: firstTicket.poster_url,
            cinemaName: firstTicket.cinema_name,
            cinemaLocation: firstTicket.cinema_location,
            hallName: firstTicket.hall_name,
            showtimeId: showtimeId,
            startTime: firstTicket.start_time,
            tickets: tickets.map(t => ({
                id: t.id,
                seatId: t.seat_id,
                type: t.ticket_type,
                price: t.price,
                status: t.status
            })),
            totalPrice: totalPrice,
            ticketCount: tickets.length
        };
    }
}

module.exports = new PaymentService();
