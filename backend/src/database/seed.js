require('dotenv').config();
const db = require('../config/db');
const tmdbService = require('../services/tmdbService');

async function runSeed() {
    console.log('Veritabanı sıfırlama ve seed (tohumlama) işlemi başlatıldı...');
    try {
        // 1. Veritabanını Temizle
        console.log('Eski veriler temizleniyor...');
        await db.query('TRUNCATE tickets, showtimes, halls, cinemas, movies RESTART IDENTITY CASCADE;');

        // 2. Sinema Ekle
        console.log('Sinema oluşturuluyor...');
        const cinemaRes = await db.query(
            'INSERT INTO cinemas (name, location) VALUES ($1, $2) RETURNING id',
            ['Paribu Cineverse Kanyon', 'Levent, Şişli / İstanbul']
        );
        const cinemaId = cinemaRes.rows[0].id;

        // 3. Salonları Ekle
        console.log('Salonlar oluşturuluyor...');
        // Basit bir koltuk dizilimi oluşturucu
        const generateSeatLayout = (rows, cols) => {
            const layout = {};
            const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
            for (let i = 0; i < rows; i++) {
                layout[rowLabels[i]] = Array.from({ length: cols }, (_, idx) => idx + 1);
            }
            return layout;
        };

        const standardLayout = generateSeatLayout(6, 10); // 60 koltuk
        const vipLayout = generateSeatLayout(4, 5); // 20 koltuk
        const imaxLayout = generateSeatLayout(8, 12); // 96 koltuk

        const hallsRes = await db.query(`
            INSERT INTO halls (cinema_id, name, seat_layout, total_seats) 
            VALUES 
            ($1, $2, $3, $4),
            ($5, $6, $7, $8),
            ($9, $10, $11, $12)
            RETURNING id, name
        `, [
            cinemaId, 'Salon 1', JSON.stringify(standardLayout), 60,
            cinemaId, 'Salon 2 (VIP)', JSON.stringify(vipLayout), 20,
            cinemaId, 'IMAX', JSON.stringify(imaxLayout), 96
        ]);
        
        const halls = hallsRes.rows;

        // 4. Filmleri Ekle
        console.log('Filmler TMDB API / JSON üzerinden çekiliyor...');
        const movies = await tmdbService.getNowPlayingMovies();
        
        if (!movies || movies.length === 0) {
            console.log('Hiç film bulunamadı!');
            process.exit(1);
        }

        const addedMovies = [];
        for (const movie of movies) {
            const insertQuery = `
                INSERT INTO movies (title, description, duration_minutes, release_date, poster_url)
                VALUES ($1, $2, $3, $4, $5) RETURNING id
            `;
            const mRes = await db.query(insertQuery, [
                movie.title, 
                movie.description, 
                movie.durationMinutes, 
                movie.releaseDate, 
                movie.posterUrl
            ]);
            addedMovies.push(mRes.rows[0].id);
        }
        console.log(`${addedMovies.length} adet film eklendi.`);

        // 5. Seansları Ekle (Showtimes)
        console.log('Seanslar oluşturuluyor...');
        let showtimeCount = 0;
        
        // Gerçekçi olması için sadece sistemdeki ilk 6 filme seans atayalım.
        // Hepsine atarsak çok kalabalık olur.
        const targetMovies = addedMovies.slice(0, 6);
        
        for (const movieId of targetMovies) {
            for (const hall of halls) {
                // Bugünden itibaren 3 gün boyunca seanslar (Saat 11:00, 15:00 ve 20:00)
                for (let day = 0; day < 3; day++) {
                    const times = [11, 15, 20];
                    for (const hour of times) {
                        const startTime = new Date();
                        startTime.setDate(startTime.getDate() + day);
                        startTime.setHours(hour, 0, 0, 0);
                        
                        const endTime = new Date(startTime);
                        endTime.setHours(endTime.getHours() + 2, 30, 0, 0); // Filmler için ortalama 2.5 saat
                        
                        // Fiyatlandırma (VIP daha pahalı)
                        let price = 120.00;
                        if (hall.name.includes('VIP')) price = 250.00;
                        if (hall.name.includes('IMAX')) price = 180.00;

                        await db.query(`
                            INSERT INTO showtimes (movie_id, hall_id, start_time, end_time, price)
                            VALUES ($1, $2, $3, $4, $5)
                        `, [movieId, hall.id, startTime, endTime, price]);
                        
                        showtimeCount++;
                    }
                }
            }
        }
        
        console.log(`${showtimeCount} adet seans başarıyla oluşturuldu!`);
        console.log('✅ Seed (Sıfırlama ve Tohumlama) işlemi başarıyla tamamlandı!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed hatası:', err.message);
        process.exit(1);
    }
}

runSeed();
