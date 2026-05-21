const cron = require('node-cron');
const tmdbService = require('../services/tmdbService');
const db = require('../config/db');
const redis = require('../config/redis');

class SyncMoviesJob {
    start() {
        // Test amaçlı olarak her 10 dakikada bir çalışacak şekilde ayarlandı.
        // Gerçek senaryoda her gece saat 03:00 için: '0 3 * * *' kullanılır.
        cron.schedule('*/10 * * * *', async () => {
            console.log(`[CRON] ${new Date().toISOString()} - Film senkronizasyonu başlatılıyor...`);
            await this.syncMovies();
        });

        // Sunucu ayağa kalkar kalkmaz 1 kere anında senkronize edelim (Test için çok faydalıdır)
        console.log('[CRON] Sunucu başlangıcı için ilk senkronizasyon tetiklendi.');
        this.syncMovies();
    }

    async syncMovies() {
        try {
            const nowPlaying = await tmdbService.getNowPlayingMovies();
            const upcoming = await tmdbService.getUpcomingMovies();
            const movies = [...nowPlaying, ...upcoming];
            
            // Deduplicate movies by title
            const uniqueMovies = [];
            const seenTitles = new Set();
            for (const movie of movies) {
                const cleanTitle = movie.title.trim();
                if (!seenTitles.has(cleanTitle)) {
                    seenTitles.add(cleanTitle);
                    uniqueMovies.push(movie);
                }
            }

            let addedCount = 0;

            for (const movie of uniqueMovies) {
                const upsertQuery = `
                    INSERT INTO movies (title, description, duration_minutes, release_date, poster_url)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (title) DO UPDATE 
                    SET description = EXCLUDED.description,
                        duration_minutes = EXCLUDED.duration_minutes,
                        release_date = EXCLUDED.release_date,
                        poster_url = EXCLUDED.poster_url
                    WHERE movies.description IS DISTINCT FROM EXCLUDED.description
                       OR movies.duration_minutes IS DISTINCT FROM EXCLUDED.duration_minutes
                       OR movies.release_date IS DISTINCT FROM EXCLUDED.release_date
                       OR movies.poster_url IS DISTINCT FROM EXCLUDED.poster_url
                    RETURNING (xmax = 0) AS is_inserted
                `;
                const res = await db.query(upsertQuery, [
                    movie.title.trim(), 
                    movie.description, 
                    movie.durationMinutes, 
                    movie.releaseDate, 
                    movie.posterUrl
                ]);
                
                if (res.rows.length > 0 && res.rows[0].is_inserted) {
                    addedCount++;
                }
            }

            console.log(`[CRON] Senkronizasyon tamamlandı! Toplam işlenen film: ${movies.length}, Eklenen yeni film sayısı: ${addedCount}`);
            
            // Redis'teki eski film listesi ve detay önbelleklerini temizle
            await redis.connect();
            if (redis.isAvailable()) {
                const client = redis.getClient();
                const keys = await client.keys('catalog:*');
                if (keys && keys.length > 0) {
                    await client.del(keys);
                    console.log(`[CRON] Redis'teki ${keys.length} adet film kataloğu önbelleği temizlendi.`);
                }
            }
            
        } catch (error) {
            console.error('[CRON ERROR] Film senkronizasyonu sırasında hata oluştu:', error.message);
        }
    }
}

module.exports = new SyncMoviesJob();

