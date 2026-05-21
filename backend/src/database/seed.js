require('dotenv').config();
const db = require('../config/db');
const tmdbService = require('../services/tmdbService');

async function runSeed() {
    console.log('Veritabanı sıfırlama ve seed (tohumlama) işlemi başlatıldı...');
    try {
        // 1. Veritabanını Temizle
        console.log('Eski veriler temizleniyor...');
        await db.query('TRUNCATE tickets, showtimes, halls, cinemas, movies RESTART IDENTITY CASCADE;');

        // Redis önbelleğini de temizleyelim
        const redis = require('../config/redis');
        await redis.connect();
        if (redis.isAvailable()) {
            await redis.getClient().flushAll();
            console.log('Redis önbelleği başarıyla temizlendi.');
        }

        // 2. Birden Fazla Sinema Lokasyonu Ekle
        console.log('Sinema lokasyonları oluşturuluyor...');
        const cinemaLocations = [
            { name: 'Paribu Cineverse Kanyon', location: 'Levent, Şişli / İstanbul' },
            { name: 'Paribu Cineverse Cevahir', location: 'Mecidiyeköy, Şişli / İstanbul' },
            { name: 'Paribu Cineverse Carousel', location: 'Avcılar / İstanbul' },
            { name: 'Paribu Cineverse Bağdat', location: 'Bağdat Caddesi, Kadıköy / İstanbul' }
        ];

        const cinemaIds = [];
        for (const cinema of cinemaLocations) {
            const res = await db.query(
                'INSERT INTO cinemas (name, location) VALUES ($1, $2) RETURNING id',
                [cinema.name, cinema.location]
            );
            cinemaIds.push(res.rows[0].id);
        }
        console.log(`${cinemaIds.length} sinema lokasyonu oluşturuldu.`);

        // 3. Salonları Ekle (Her sinemaya farklı salon düzenleri)
        console.log('Salonlar oluşturuluyor...');
        
        // Koltuk dizilimi oluşturucu
        const generateSeatLayout = (rows, cols) => {
            const layout = {};
            const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
            for (let i = 0; i < rows; i++) {
                layout[rowLabels[i]] = Array.from({ length: cols }, (_, idx) => idx + 1);
            }
            return layout;
        };

        // Farklı koltuk düzenleri
        const seatLayouts = {
            standard: generateSeatLayout(6, 10), // 60 koltuk
            vip: generateSeatLayout(4, 5), // 20 koltuk
            imax: generateSeatLayout(8, 12), // 96 koltuk
            premium: generateSeatLayout(5, 8), // 40 koltuk
            compact: generateSeatLayout(4, 6), // 24 koltuk
            large: generateSeatLayout(10, 14), // 140 koltuk
        };

        // Sinema konfigürasyonu: her sinemaya farklı salonlar
        const cinemaConfigs = [
            { halls: ['Salon 1', 'Salon 2 (VIP)', 'IMAX'] },
            { halls: ['Salon A', 'Salon B (Premium)', 'Salon C (Compact)'] },
            { halls: ['Sinema 1', 'Sinema 2', 'Sinema 3'] },
            { halls: ['Hall Standard', 'Hall Büyük', 'Hall VIP'] }
        ];

        const hallLayoutMapping = {
            'Salon 1': { layout: seatLayouts.standard, seats: 60 },
            'Salon 2 (VIP)': { layout: seatLayouts.vip, seats: 20 },
            'IMAX': { layout: seatLayouts.imax, seats: 96 },
            'Salon A': { layout: seatLayouts.compact, seats: 24 },
            'Salon B (Premium)': { layout: seatLayouts.premium, seats: 40 },
            'Salon C (Compact)': { layout: seatLayouts.standard, seats: 60 },
            'Sinema 1': { layout: seatLayouts.vip, seats: 20 },
            'Sinema 2': { layout: seatLayouts.large, seats: 140 },
            'Sinema 3': { layout: seatLayouts.premium, seats: 40 },
            'Hall Standard': { layout: seatLayouts.standard, seats: 60 },
            'Hall Büyük': { layout: seatLayouts.large, seats: 140 },
            'Hall VIP': { layout: seatLayouts.imax, seats: 96 }
        };

        const halls = [];
        for (let i = 0; i < cinemaIds.length; i++) {
            const cinemaId = cinemaIds[i];
            const config = cinemaConfigs[i];
            
            for (const hallName of config.halls) {
                const layoutConfig = hallLayoutMapping[hallName];
                const hallRes = await db.query(
                    'INSERT INTO halls (cinema_id, name, seat_layout, total_seats) VALUES ($1, $2, $3, $4) RETURNING id, name',
                    [cinemaId, hallName, JSON.stringify(layoutConfig.layout), layoutConfig.seats]
                );
                halls.push(hallRes.rows[0]);
            }
        }
        console.log(`${halls.length} salon oluşturuldu.`);

        // 4. Filmleri Ekle
        console.log('Filmler TMDB API / JSON üzerinden çekiliyor...');
        const nowPlayingMovies = await tmdbService.getNowPlayingMovies();
        const upcomingMovies = await tmdbService.getUpcomingMovies();
        
        const allMovies = [...nowPlayingMovies, ...upcomingMovies];
        
        // Deduplicate movies by title
        const uniqueMovies = [];
        const seenTitles = new Set();
        for (const movie of allMovies) {
            const cleanTitle = movie.title.trim();
            if (!seenTitles.has(cleanTitle)) {
                seenTitles.add(cleanTitle);
                uniqueMovies.push(movie);
            }
        }
        
        const nowPlayingIds = [];
        const upcomingIds = [];
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        console.log('Filmler veritabanına ekleniyor (çakışma kontrolüyle)...');
        for (const movie of uniqueMovies) {
            const insertQuery = `
                INSERT INTO movies (title, description, duration_minutes, release_date, poster_url)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (title) DO UPDATE 
                SET description = EXCLUDED.description,
                    duration_minutes = EXCLUDED.duration_minutes,
                    release_date = EXCLUDED.release_date,
                    poster_url = EXCLUDED.poster_url
                RETURNING id, title, release_date
            `;
            const mRes = await db.query(insertQuery, [
                movie.title.trim(), 
                movie.description, 
                movie.durationMinutes, 
                movie.releaseDate, 
                movie.posterUrl
            ]);
            
            const dbMovie = mRes.rows[0];
            const releaseDateObj = new Date(dbMovie.release_date);
            
            if (releaseDateObj <= today) {
                nowPlayingIds.push(dbMovie.id);
            } else {
                upcomingIds.push(dbMovie.id);
            }
        }
        
        console.log(`${nowPlayingIds.length} vizyonda (seans tanımlanacak), ${upcomingIds.length} yakında film eklendi.`);

        // 5. Seansları Ekle (Showtimes) - Toplu INSERT ile hızlı ekleme
        console.log('Seanslar oluşturuluyor (toplu INSERT)...');

        const movieIds = [];
        const hallIds = [];
        const startTimes = [];
        const endTimes = [];
        const prices = [];
        const formats = [];
        const languageTypes = [];

        // Yalnızca vizyondaki filmlere seans tanımlıyoruz
        for (const movieId of nowPlayingIds) {
            for (const hall of halls) {
                const hallName = hall.name.toLowerCase();
                let price = 120.00;
                if (hallName.includes('vip')) price = 250.00;
                if (hallName.includes('imax')) price = 180.00;
                if (hallName.includes('premium')) price = 200.00;
                if (hallName.includes('büyük') || hallName.includes('large')) price = 140.00;
                if (hallName.includes('compact') || hallName.includes('küçük')) price = 100.00;

                for (let day = 0; day < 5; day++) {
                    let hourIdx = 0;
                    for (const hour of [10, 14, 18, 21]) {
                        const startTime = new Date();
                        startTime.setDate(startTime.getDate() + day);
                        startTime.setHours(hour, 0, 0, 0);

                        const endTime = new Date(startTime);
                        endTime.setHours(endTime.getHours() + 2, 30, 0, 0);

                        // Format belirle
                        let format = '2D';
                        if (hallName.includes('imax')) {
                            format = 'IMAX';
                        } else if (hour === 18 && hourIdx % 2 === 0) {
                            format = '3D';
                        }

                        // Dil seçeneği belirle
                        let languageType = 'Türkçe Dublaj';
                        if (hour === 21 || (hour === 14 && hourIdx % 2 === 1)) {
                            languageType = 'Türkçe Altyazılı';
                        }

                        movieIds.push(movieId);
                        hallIds.push(hall.id);
                        startTimes.push(startTime);
                        endTimes.push(endTime);
                        prices.push(price);
                        formats.push(format);
                        languageTypes.push(languageType);
                        
                        hourIdx++;
                    }
                }
            }
        }

        // Tek sorguda tüm seansları ekle (unnest ile)
        await db.query(`
            INSERT INTO showtimes (movie_id, hall_id, start_time, end_time, price, format, language_type)
            SELECT * FROM unnest(
                $1::uuid[], $2::uuid[], $3::timestamptz[], $4::timestamptz[], $5::numeric[], $6::varchar[], $7::varchar[]
            )
        `, [movieIds, hallIds, startTimes, endTimes, prices, formats, languageTypes]);

        const showtimeCount = movieIds.length;
        
        console.log(`${showtimeCount} adet seans başarıyla oluşturuldu!`);
        console.log(`📊 Veritabanı Özeti:`);
        console.log(`   - Sinema Lokasyonları: ${cinemaIds.length}`);
        console.log(`   - Toplam Salon: ${halls.length}`);
        console.log(`   - Toplam Film: ${nowPlayingIds.length + upcomingIds.length}`);
        console.log(`   - Toplam Seans: ${showtimeCount}`);
        console.log('✅ Seed (Sıfırlama ve Tohumlama) işlemi başarıyla tamamlandı!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed hatası:', err.message);
        process.exit(1);
    }
}

runSeed();
