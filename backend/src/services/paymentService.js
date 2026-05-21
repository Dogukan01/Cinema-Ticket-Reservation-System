const db = require('../config/db');
const redis = require('../config/redis');

class PaymentService {
    /**
     * Müşterinin PENDING statüsündeki biletlerini bulur ve "Mock" bir ödeme işlemi gerçekleştirir.
     */
    /**
     * Kupon kodunu doğrular ve indirim detaylarını döner.
     */
    async validateCoupon(userId, guestId, showtimeId, couponCode) {
        // 1. Kuponu bul
        const couponRes = await db.query(
            "SELECT * FROM coupons WHERE code = $1 AND is_active = TRUE",
            [couponCode]
        );

        if (couponRes.rows.length === 0) {
            throw new Error('Geçersiz veya aktif olmayan kupon kodu.');
        }

        const coupon = couponRes.rows[0];

        // Son kullanma tarihini kontrol et
        if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
            throw new Error('Bu kuponun kullanım süresi dolmuş.');
        }

        // Sepet tutarını hesapla
        let pendingResult;
        if (userId) {
            pendingResult = await db.query(
                "SELECT SUM(price) as total FROM tickets WHERE user_id = $1 AND showtime_id = $2 AND status = 'PENDING'",
                [userId, showtimeId]
            );
        } else if (guestId) {
            pendingResult = await db.query(
                "SELECT SUM(price) as total FROM tickets WHERE guest_id = $1 AND showtime_id = $2 AND status = 'PENDING'",
                [guestId, showtimeId]
            );
        } else {
            throw new Error('Kimlik bilgisi bulunamadı.');
        }

        const totalAmount = parseFloat(pendingResult.rows[0].total || 0);
        if (totalAmount === 0) {
            throw new Error('Kupon uygulamak için sepetinizde bilet bulunmalıdır.');
        }

        // Minimum tutar kontrolü
        const minAmount = parseFloat(coupon.min_amount);
        if (totalAmount < minAmount) {
            throw new Error(`Bu kupon sadece en az ${minAmount} TL tutarındaki alışverişlerde geçerlidir.`);
        }

        // İndirim miktarını hesapla
        let discountAmount = 0;
        if (coupon.discount_type === 'PERCENTAGE') {
            discountAmount = totalAmount * (parseFloat(coupon.discount_value) / 100);
        } else if (coupon.discount_type === 'FLAT') {
            discountAmount = parseFloat(coupon.discount_value);
        }

        // İndirim sepet tutarından büyük olamaz
        if (discountAmount > totalAmount) {
            discountAmount = totalAmount;
        }

        return {
            code: coupon.code,
            discountType: coupon.discount_type,
            discountValue: parseFloat(coupon.discount_value),
            minAmount: minAmount,
            discountAmount: parseFloat(discountAmount.toFixed(2)),
            newTotal: parseFloat((totalAmount - discountAmount).toFixed(2))
        };
    }

    /**
     * Müşterinin PENDING statüsündeki biletlerini bulur, kupon ve puan indirimlerini uygular ve "Mock" bir ödeme işlemi gerçekleştirir.
     */
    async processPayment(userId, guestId, showtimeId, cardNumber, cvv, expiryDate, couponCode, usePoints) {
        // 1. Kullanıcının PENDING biletlerini bul
        let pendingResult;
        
        if (userId) {
            pendingResult = await db.query(
                "SELECT id, seat_id, price FROM tickets WHERE user_id = $1 AND showtime_id = $2 AND status = 'PENDING'",
                [userId, showtimeId]
            );
        } else if (guestId) {
            pendingResult = await db.query(
                "SELECT id, seat_id, price FROM tickets WHERE guest_id = $1 AND showtime_id = $2 AND status = 'PENDING'",
                [guestId, showtimeId]
            );
        } else {
            throw new Error('Kimlik bilgisi bulunamadı.');
        }

        if (pendingResult.rows.length === 0) {
            throw new Error('Ödenecek bilet (sepet) bulunamadı veya 10 dakikalık süreniz doldu.');
        }

        const pendingTickets = pendingResult.rows;
        const baseTotal = pendingTickets.reduce((sum, t) => sum + parseFloat(t.price), 0);

        // Kupon indirimi hesaplama
        let discountFromCoupon = 0;
        let validatedCoupon = null;

        if (couponCode) {
            try {
                validatedCoupon = await this.validateCoupon(userId, guestId, showtimeId, couponCode);
                discountFromCoupon = validatedCoupon.discountAmount;
            } catch (err) {
                throw new Error(`Kupon uygulaması başarısız: ${err.message}`);
            }
        }

        // Sadakat puanı indirimi hesaplama
        let pointsUsed = 0;
        let discountFromPoints = 0;
        let userPoints = 0;

        const remainingAfterCoupon = baseTotal - discountFromCoupon;

        if (userId && usePoints) {
            const userRes = await db.query("SELECT loyalty_points FROM users WHERE id = $1", [userId]);
            if (userRes.rows.length > 0) {
                userPoints = userRes.rows[0].loyalty_points || 0;
                // 10 puan = 1 TL
                const maxPointsDiscountTL = userPoints / 10;
                discountFromPoints = Math.min(maxPointsDiscountTL, remainingAfterCoupon);
                pointsUsed = Math.floor(discountFromPoints * 10);
                discountFromPoints = pointsUsed / 10;
            }
        }

        const totalDiscount = discountFromCoupon + discountFromPoints;

        // Ödeme kartı doğrulama
        const cleanCardNumber = cardNumber.replace(/\D/g, '');
        if (cleanCardNumber.length !== 16) {
            throw new Error('Kart numarası geçersiz. Kart numarası tam olarak 16 haneli olmalıdır.');
        }

        // CVV doğrulaması (3 hane ve sadece rakam)
        if (!cvv || cvv.toString().replace(/\D/g, '').length !== 3) {
            throw new Error('CVV kodu geçersiz. CVV kodu tam olarak 3 haneli ve sadece rakamlardan oluşmalıdır.');
        }

        // Son Kullanma Tarihi doğrulaması (AA/YY formatı ve geçerli ay)
        const expiryPattern = /^(0[1-9]|1[0-2])\/\d{2}$/;
        if (!expiryDate || !expiryPattern.test(expiryDate)) {
            throw new Error('Son kullanma tarihi geçersiz. AA/YY formatında ve geçerli bir ay (01-12) olmalıdır.');
        }

        const isPaymentSuccessful = cleanCardNumber.length === 16;

        if (!isPaymentSuccessful) {
            throw new Error('Ödeme reddedildi! Lütfen limitinizi kontrol edip tekrar deneyin.');
        }

        // İndirimleri biletlere orantılı olarak dağıt
        let pointsSum = 0;
        let netPriceSum = 0;
        const totalNetPrice = baseTotal - totalDiscount;

        const ticketUpdates = pendingTickets.map((t, idx) => {
            const ticketPrice = parseFloat(t.price);
            let ticketPointsUsed = 0;
            let ticketNetPrice = 0;

            if (idx === pendingTickets.length - 1) {
                ticketPointsUsed = pointsUsed - pointsSum;
                ticketNetPrice = parseFloat((totalNetPrice - netPriceSum).toFixed(2));
            } else {
                ticketPointsUsed = Math.round(baseTotal > 0 ? (ticketPrice / baseTotal) * pointsUsed : 0);
                ticketNetPrice = parseFloat((ticketPrice - (baseTotal > 0 ? (ticketPrice / baseTotal) * totalDiscount : 0)).toFixed(2));
                
                pointsSum += ticketPointsUsed;
                netPriceSum += ticketNetPrice;
            }

            return {
                id: t.id,
                netPrice: ticketNetPrice,
                pointsEarned: 10, // Her onaylanmış bilet için +10 puan
                pointsUsed: ticketPointsUsed
            };
        });

        // 3. Ödeme Başarılıysa Transaction (İşlem Bloğu) başlat
        const dbClient = await db.pool.connect();
        await redis.connect();
        const redisClient = redis.getClient();

        try {
            await dbClient.query('BEGIN');

            for (const update of ticketUpdates) {
                const updateQuery = `
                    UPDATE tickets 
                    SET status = 'CONFIRMED', 
                        price = $2, 
                        loyalty_points_earned = $3, 
                        loyalty_points_used = $4,
                        updated_at = NOW() 
                    WHERE id = $1
                `;
                await dbClient.query(updateQuery, [update.id, update.netPrice, update.pointsEarned, update.pointsUsed]);
            }

            // Puan kazanımı ve düşümü
            if (userId) {
                const totalEarnedPoints = pendingTickets.length * 10;
                const updatePointsQuery = `
                    UPDATE users 
                    SET loyalty_points = GREATEST(0, loyalty_points - $1 + $2) 
                    WHERE id = $3
                `;
                await dbClient.query(updatePointsQuery, [pointsUsed, totalEarnedPoints, userId]);
            }

            // Redis kilitlerini KALICI olarak temizle (Artık koltuklar tamamen satıldı)
            if (redis.isAvailable()) {
                for (const ticket of pendingTickets) {
                    const lockKey = `seat_lock:${showtimeId}:${ticket.seat_id}`;
                    await redisClient.del(lockKey);
                }
            }

            await dbClient.query('COMMIT');

            // Fatura/Makbuz Numarası oluştur (Sahte)
            const receiptId = 'TRX-' + Math.random().toString(36).substr(2, 9).toUpperCase();

            // Güncellenmiş biletleri geri getir
            const confirmedResult = await db.query(
                "SELECT id, seat_id, price FROM tickets WHERE id = ANY($1::uuid[])",
                [pendingTickets.map(t => t.id)]
            );

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
