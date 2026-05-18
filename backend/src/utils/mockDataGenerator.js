require('dotenv').config({ path: '../../.env' });
const db = require('../config/db');

async function generateMockData() {
    try {
        console.log('Mock veri üretimi başlatılıyor...');

        // 1. Önce filmleri kontrol et
        const moviesRes = await db.query('SELECT * FROM movies');
        if (moviesRes.rows.length === 0) {
            console.log('Veritabanında film yok! Önce sunucuyu başlatıp TMDB Job\'ının çalışmasını bekleyin.');
            process.exit(1);
        }

        // 2. Sinema oluştur
        const cinemaRes = await db.query(
            "INSERT INTO cinemas (name, location) VALUES ($1, $2) RETURNING id",
            ['SBRS Kadıköy IMAX', 'Kadıköy, İstanbul']
        );
        const cinemaId = cinemaRes.rows[0].id;

        // 3. Salon oluştur (JSON Seat Layout ile)
        // 5 satır (A-E), 8 sütun (1-8) = 40 koltukluk bir salon matrisi
        const layout = {
            rows: ['A', 'B', 'C', 'D', 'E'],
            cols: 8
        };

        const hallRes = await db.query(
            "INSERT INTO halls (cinema_id, name, seat_layout, total_seats) VALUES ($1, $2, $3, $4) RETURNING id",
            [cinemaId, 'Salon 1 - Kırmızı', JSON.stringify(layout), 40]
        );
        const hallId = hallRes.rows[0].id;

        // 4. Her film için 2 adet seans oluştur (Bugün 20:00 ve 23:00)
        let showtimeCount = 0;
        const today = new Date();
        today.setHours(20, 0, 0, 0); // Bugün 20:00

        const tonight = new Date();
        tonight.setHours(23, 0, 0, 0); // Bugün 23:00

        for (const movie of moviesRes.rows) {
            // Seans 1
            const end1 = new Date(today.getTime() + (movie.duration_minutes + 20) * 60000);
            await db.query(
                "INSERT INTO showtimes (movie_id, hall_id, start_time, end_time, price) VALUES ($1, $2, $3, $4, $5)",
                [movie.id, hallId, today.toISOString(), end1.toISOString(), 150.00]
            );

            // Seans 2
            const end2 = new Date(tonight.getTime() + (movie.duration_minutes + 20) * 60000);
            await db.query(
                "INSERT INTO showtimes (movie_id, hall_id, start_time, end_time, price) VALUES ($1, $2, $3, $4, $5)",
                [movie.id, hallId, tonight.toISOString(), end2.toISOString(), 150.00]
            );
            showtimeCount += 2;
        }

        console.log(`✅ Başarılı! 1 Sinema, 1 Salon ve toplam ${showtimeCount} adet Seans oluşturuldu.`);
        process.exit(0);

    } catch (error) {
        console.error('HATA:', error.message);
        process.exit(1);
    }
}

generateMockData();
