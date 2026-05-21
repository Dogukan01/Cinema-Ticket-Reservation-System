const db = require('../config/db');
const redis = require('../config/redis');

class CatalogService {
    // ==========================================
    // FİLMLER (MOVIES)
    // ==========================================
    async createMovie(movieData) {
        const { title, description, durationMinutes, releaseDate, posterUrl } = movieData;

        const query = `
            INSERT INTO movies (title, description, duration_minutes, release_date, poster_url)
            VALUES ($1, $2, $3, $4, $5) RETURNING *
        `;
        const values = [title, description, durationMinutes, releaseDate, posterUrl];

        const result = await db.query(query, values);
        
        // Önbelleği temizle
        if (redis.isAvailable()) {
            await redis.getClient().del('catalog:movies');
        }
        
        return result.rows[0];
    }

    async getMovies() {
        await redis.connect();
        const cacheKey = 'catalog:movies';

        if (redis.isAvailable()) {
            const client = redis.getClient();
            const cachedMovies = await client.get(cacheKey);
            if (cachedMovies) return JSON.parse(cachedMovies);

            const result = await db.query('SELECT * FROM movies ORDER BY created_at DESC');
            await client.setEx(cacheKey, 600, JSON.stringify(result.rows));
            return result.rows;
        }

        // Redis yoksa direkt DB'den oku
        const result = await db.query('SELECT * FROM movies ORDER BY created_at DESC');
        return result.rows;
    }

    async getMovieWithShowtimes(movieId) {
        await redis.connect();
        const cacheKey = `catalog:movie:${movieId}`;

        let finalData = null;
        if (redis.isAvailable()) {
            const client = redis.getClient();
            const cachedData = await client.get(cacheKey);
            if (cachedData) {
                finalData = JSON.parse(cachedData);
            }
        }

        if (!finalData) {
            // 1. Film Detayları
            const movieResult = await db.query('SELECT * FROM movies WHERE id = $1', [movieId]);
            if (movieResult.rows.length === 0) throw new Error('Film bulunamadı.');
            const movie = movieResult.rows[0];

            // TMDB detay zenginleştirmesi
            let enrichment = null;
            try {
                const tmdbService = require('./tmdbService');
                enrichment = await tmdbService.enrichMovieDetails(movie.title);
            } catch (err) {
                console.error('TMDB Enrichment failed:', err.message);
            }

            // 2. Bu filme ait Seanslar (Sinema ve Salon bilgileriyle birleştirilmiş)
            const showtimesQuery = `
                SELECT s.id as showtime_id, s.start_time, s.price, s.format, s.language_type,
                       h.name as hall_name, h.id as hall_id,
                       c.name as cinema_name, c.id as cinema_id
                FROM showtimes s
                JOIN halls h ON s.hall_id = h.id
                JOIN cinemas c ON h.cinema_id = c.id
                WHERE s.movie_id = $1 AND s.start_time >= NOW() - INTERVAL '2 hours'
                ORDER BY c.name, s.start_time ASC
            `;
            const showtimesResult = await db.query(showtimesQuery, [movieId]);

            finalData = {
                ...movie,
                ...enrichment,
                showtimes: showtimesResult.rows
            };


            if (redis.isAvailable()) {
                const client = redis.getClient();
                await client.setEx(cacheKey, 600, JSON.stringify(finalData));
            }
        }

        // Saati ve tarihi geçmiş seansları milisaniye duyarlılığıyla filtrele
        const now = new Date();
        if (finalData && finalData.showtimes) {
            finalData.showtimes = finalData.showtimes.filter(st => new Date(st.start_time) >= now);
        }

        return finalData;
    }

    // ==========================================
    // SİNEMALAR VE SALONLAR (CINEMAS & HALLS)
    // ==========================================
    async createCinema(name, location) {
        const query = `INSERT INTO cinemas (name, location) VALUES ($1, $2) RETURNING *`;
        const result = await db.query(query, [name, location]);
        return result.rows[0];
    }

    async createHall(cinemaId, name, seatLayout, totalSeats) {
        // seatLayout JSON nesnesi olarak gelmelidir.
        // Örn: { rows: 10, cols: 20, structure: [...] }
        const query = `
            INSERT INTO halls (cinema_id, name, seat_layout, total_seats)
            VALUES ($1, $2, $3, $4) RETURNING *
        `;
        const result = await db.query(query, [cinemaId, name, JSON.stringify(seatLayout), totalSeats]);
        return result.rows[0];
    }

    // ==========================================
    // SEANSLAR (SHOWTIMES) VE ÇAKIŞMA ALGORİTMASI
    // ==========================================
    async createShowtime(movieId, hallId, startTime, price, format = '2D', languageType = 'Türkçe Dublaj') {
        // 1. Filmin süresini (duration_minutes) öğren
        const movieResult = await db.query('SELECT duration_minutes FROM movies WHERE id = $1', [movieId]);
        if (movieResult.rows.length === 0) throw new Error('Film bulunamadı.');
        const durationMinutes = movieResult.rows[0].duration_minutes;

        // 2. Bitiş saatini hesapla (Başlangıç + Film Süresi + 20 Dakika Hazırlık/Temizlik)
        const start = new Date(startTime);
        const end = new Date(start.getTime() + (durationMinutes + 20) * 60000);

        // 3. SEANS ÇAKIŞMA ÖNLEME ALGORİTMASI (Epic 2.3)
        // Aynı salonda, önerilen [start, end] zaman aralığı ile kesişen başka bir seans var mı?
        const overlapQuery = `
            SELECT id FROM showtimes
            WHERE hall_id = $1
            AND (
                (start_time < $3 AND end_time > $2) -- Kesişim mantığı: Mevcut bitiş önerilen başlangıçtan büyüktür VE mevcut başlangıç önerilen bitişten küçüktür
            )
        `;
        const overlapResult = await db.query(overlapQuery, [hallId, start.toISOString(), end.toISOString()]);

        if (overlapResult.rows.length > 0) {
            throw new Error('Seans çakışması! Bu salonda belirtilen saat aralığında (hazırlık süresi dâhil) başka bir film oynamaktadır.');
        }

        // 4. Çakışma yoksa seansı kaydet
        const insertQuery = `
            INSERT INTO showtimes (movie_id, hall_id, start_time, end_time, price, format, language_type)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
        `;
        const insertResult = await db.query(insertQuery, [movieId, hallId, start.toISOString(), end.toISOString(), price, format, languageType]);

        // Önbelleği temizle
        if (redis.isAvailable()) {
            await redis.getClient().del(`catalog:movie:${movieId}`);
            await redis.getClient().del('catalog:movies');
        }

        return insertResult.rows[0];
    }
}

module.exports = new CatalogService();
