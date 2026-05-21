const db = require('../config/db');
const seatLockService = require('./seatLockService');
const redis = require('../config/redis');

class ReservationService {
    /**
     * Belirli bir seans için salonun koltuk düzenini ve koltukların anlık durumunu getirir.
     * PostgreSQL (Satılmış) ve Redis (Kilitlenmiş) verilerini harmanlar.
     */
    async getAvailableSeats(showtimeId) {
        // 1. Seans ve Salon bilgilerini getir
        const showtimeResult = await db.query(`
            SELECT s.id, s.hall_id, h.seat_layout 
            FROM showtimes s 
            JOIN halls h ON s.hall_id = h.id 
            WHERE s.id = $1
        `, [showtimeId]);

        if (showtimeResult.rows.length === 0) {
            throw new Error('Seans bulunamadı.');
        }

        const showtime = showtimeResult.rows[0];
        const seatLayout = showtime.seat_layout;

        // 2. PostgreSQL'den Satılmış veya Ödeme Bekleyen biletleri al
        const ticketsResult = await db.query(`
            SELECT seat_id, status FROM tickets 
            WHERE showtime_id = $1 AND status IN ('CONFIRMED', 'PENDING')
        `, [showtimeId]);
        
        const dbReservedSeats = ticketsResult.rows.map(t => t.seat_id);

        // 3. Redis'ten anlık olarak kilitlenmiş koltukları bul (Optimistic Locking)
        await redis.connect();
        let redisLockedSeats = [];

        if (redis.isAvailable()) {
            const client = redis.getClient();
            const lockPattern = `seat_lock:${showtimeId}:*`;
            const lockedKeys = [];
            for await (const item of client.scanIterator({ MATCH: lockPattern, COUNT: 100 })) {
                if (Array.isArray(item)) lockedKeys.push(...item);
                else if (typeof item === 'string') lockedKeys.push(item);
            }
            redisLockedSeats = lockedKeys.map(key => key.split(':').pop());
        }

        // 4. Sonuçları birleştir (Eğer bir koltuk DB'de veya Redis'te varsa DOLUDUR)
        const unavailableSeats = [...new Set([...dbReservedSeats, ...redisLockedSeats])];

        return {
            hallId: showtime.hall_id,
            seatLayout: seatLayout,
            unavailableSeats: unavailableSeats
        };
    }

    /**
     * Kullanıcının kilitlediği koltukları PENDING (Beklemede) biletlerine dönüştürür.
     * Ödeme aşamasına geçiş için hazırlık adımıdır.
     * Maksimum 6 bilet sınırını kontrol eder.
     */
    async reserveTickets(identifier, userId, guestId, showtimeId, seatSelections) {
        if (!Array.isArray(seatSelections) || seatSelections.length === 0) {
            throw new Error('En az 1 koltuk seçmelisiniz.');
        }

        // Karaborsa Koruması (Max 6)
        if (seatSelections.length > 6) {
            throw new Error('Tek bir işlemde en fazla 6 adet bilet ayırabilirsiniz.');
        }

        // Seans fiyatını al
        const showtimeRes = await db.query('SELECT price FROM showtimes WHERE id = $1', [showtimeId]);
        if (showtimeRes.rows.length === 0) throw new Error('Seans bulunamadı.');
        const price = showtimeRes.rows[0].price;

        await redis.connect();
        const redisReady = redis.isAvailable();
        const client = redisReady ? redis.getClient() : null;

        // Transaction (İşlem bloğu) başlatıyoruz (DB üzerinde güvenli çoklu işlem)
        const dbClient = await db.pool.connect();
        try {
            await dbClient.query('BEGIN');

            const createdTickets = [];

            for (const selection of seatSelections) {
                const { seatId, type } = selection;

                // Redis lock sadece UX amaçlı (diğer kullanıcılara "kilitli" göstermek için).
                // Veri bütünlüğü DB'deki UNIQUE constraint ile garantilenir.
                // (unique_seat_showtime: aynı showtime+seat çifti 2 kez insert edilemez)


                
                // Fiyat hesaplama
                const ticketType = type === 'STUDENT' ? 'STUDENT' : 'ADULT';
                const finalPrice = ticketType === 'STUDENT' ? price * 0.8 : price;

                // 2. Veritabanına PENDING biletini yaz (Eğer başkası DB'ye yazdıysa Unique constraint hata fırlatır)
                const insertQuery = `
                    INSERT INTO tickets (user_id, guest_id, showtime_id, seat_id, status, price, ticket_type)
                    VALUES ($1, $2, $3, $4, 'PENDING', $5, $6) RETURNING *
                `;
                const result = await dbClient.query(insertQuery, [userId, guestId, showtimeId, seatId, finalPrice, ticketType]);
                createdTickets.push(result.rows[0]);

                // Not: Redis kilidini BURADA kaldırmıyoruz. Ödeme (Epic 3) başarılı olunca tamamen silinecek.
                // Veya ödeme için ek süre tanınacaksa TTL uzatılabilir.
            }

            await dbClient.query('COMMIT');
            return createdTickets;

        } catch (error) {
            await dbClient.query('ROLLBACK');
            throw error;
        } finally {
            dbClient.release();
        }
    }

    /**
     * Kullanıcının belirli bir seans için PENDING biletlerini iptal eder.
     * Checkout'tan geri dönüldüğünde koltuğun tekrar seçilebilmesi için çağrılır.
     */
    async cancelPendingTickets(identifier, userId, guestId, showtimeId) {
        // PENDING biletleri çek (kimin olduğunu belirle)
        const whereClause = userId
            ? 'user_id = $1 AND showtime_id = $2 AND status = $3'
            : 'guest_id = $1 AND showtime_id = $2 AND status = $3';
        const queryValues = [userId || guestId, showtimeId, 'PENDING'];

        const result = await db.query(
            `DELETE FROM tickets WHERE ${whereClause} RETURNING seat_id`,
            queryValues
        );

        const cancelledSeatIds = result.rows.map(r => r.seat_id);

        // Redis lock'larını da temizle
        await redis.connect();
        if (redis.isAvailable() && cancelledSeatIds.length > 0) {
            const client = redis.getClient();
            for (const seatId of cancelledSeatIds) {
                const lockKey = `seat_lock:${showtimeId}:${seatId}`;
                try { await client.del(lockKey); } catch (e) {}
            }
        }

        return cancelledSeatIds;
    }

    /**
     * Satın alınmış onaylı bir bileti iptal eder.
     * Koşul: Seansa en az 2 saat kalmış olmalı.
     * Kullanıcının kazandığı puanları düşer ve harcadığı puanları iade eder.
     */
    async cancelTicket(userId, ticketId) {
        // 1. Bileti ve seans saatini getir
        const ticketRes = await db.query(
            `SELECT t.id, t.user_id, t.showtime_id, t.status, t.price, t.seat_id,
                    t.loyalty_points_earned, t.loyalty_points_used, s.start_time
             FROM tickets t
             JOIN showtimes s ON t.showtime_id = s.id
             WHERE t.id = $1`,
            [ticketId]
        );

        if (ticketRes.rows.length === 0) {
            throw new Error('Bilet bulunamadı.');
        }

        const ticket = ticketRes.rows[0];

        // 2. Yetki kontrolü (Bilet bu kullanıcıya mı ait?)
        if (ticket.user_id !== userId) {
            throw new Error('Bu bilet üzerinde işlem yapma yetkiniz yok.');
        }

        // 3. Statü kontrolü
        if (ticket.status !== 'CONFIRMED') {
            throw new Error('Sadece satın alınmış (onaylı) biletler iptal edilebilir.');
        }

        // 4. Zaman kontrolü (seansa en az 2 saat kala)
        const startTime = new Date(ticket.start_time);
        const now = new Date();
        const diffMs = startTime - now;
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < 2) {
            throw new Error('Biletinizi seans başlangıcına en geç 2 saat kalaya kadar iptal edebilirsiniz.');
        }

        // 5. Veritabanı işlemleri (Transaction ile)
        const dbClient = await db.pool.connect();
        try {
            await dbClient.query('BEGIN');

            // Bilet durumunu CANCELLED yap
            await dbClient.query(
                "UPDATE tickets SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1",
                [ticketId]
            );

            // Sadakat puanlarını güncelle
            // Kazanılan puanları düş, kullanılan puanları iade et
            const pointsEarned = ticket.loyalty_points_earned || 0;
            const pointsUsed = ticket.loyalty_points_used || 0;

            const netPointsRefund = pointsUsed - pointsEarned;

            if (netPointsRefund !== 0) {
                await dbClient.query(
                    "UPDATE users SET loyalty_points = GREATEST(0, loyalty_points + $1) WHERE id = $2",
                    [netPointsRefund, userId]
                );
            }

            await dbClient.query('COMMIT');
            return {
                ticketId: ticketId,
                status: 'CANCELLED',
                refundedPoints: pointsUsed,
                deductedPoints: pointsEarned
            };
        } catch (error) {
            await dbClient.query('ROLLBACK');
            throw error;
        } finally {
            dbClient.release();
        }
    }
}

module.exports = new ReservationService();
