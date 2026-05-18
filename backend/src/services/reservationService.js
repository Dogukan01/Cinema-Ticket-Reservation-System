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
        const client = redis.getClient();
        const lockPattern = `seat_lock:${showtimeId}:*`;
        
        // SCAN veya KEYS komutu ile kilitleri bul (Burada performans için KEYS kullanıyoruz, gerçekte SCAN önerilir)
        const lockedKeys = await client.keys(lockPattern);
        
        const redisLockedSeats = lockedKeys.map(key => {
            // key yapısı: seat_lock:showtimeId:seatId
            const parts = key.split(':');
            return parts[parts.length - 1]; // son parça seatId
        });

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
    async reserveTickets(userId, showtimeId, seatIds) {
        if (!Array.isArray(seatIds) || seatIds.length === 0) {
            throw new Error('En az 1 koltuk seçmelisiniz.');
        }

        // Karaborsa Koruması (Max 6)
        if (seatIds.length > 6) {
            throw new Error('Tek bir işlemde en fazla 6 adet bilet ayırabilirsiniz.');
        }

        // Seans fiyatını al
        const showtimeRes = await db.query('SELECT price FROM showtimes WHERE id = $1', [showtimeId]);
        if (showtimeRes.rows.length === 0) throw new Error('Seans bulunamadı.');
        const price = showtimeRes.rows[0].price;

        await redis.connect();
        const client = redis.getClient();

        // Transaction (İşlem bloğu) başlatıyoruz (DB üzerinde güvenli çoklu işlem)
        const dbClient = await db.pool.connect();
        try {
            await dbClient.query('BEGIN');

            const createdTickets = [];

            for (const seatId of seatIds) {
                // 1. Redis'te bu koltuk gerçekten BU KULLANICI tarafından kilitlenmiş mi?
                const lockKey = `seat_lock:${showtimeId}:${seatId}`;
                const lockOwner = await client.get(lockKey);

                if (lockOwner !== userId) {
                    throw new Error(\`\${seatId} numaralı koltuk kilitli değil veya kilidin süresi dolmuş. Lütfen koltuğu tekrar seçin.\`);
                }

                // 2. Veritabanına PENDING biletini yaz (Eğer başkası DB'ye yazdıysa Unique constraint hata fırlatır)
                const insertQuery = \`
                    INSERT INTO tickets (user_id, showtime_id, seat_id, status, price)
                    VALUES ($1, $2, $3, 'PENDING', $4) RETURNING *
                \`;
                const result = await dbClient.query(insertQuery, [userId, showtimeId, seatId, price]);
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
}

module.exports = new ReservationService();
