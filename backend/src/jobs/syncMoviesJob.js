const cron = require('node-cron');
const tmdbService = require('../services/tmdbService');
const db = require('../config/db');

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
            const movies = await tmdbService.getNowPlayingMovies();
            let addedCount = 0;

            for (const movie of movies) {
                // 1. Film veritabanımızda zaten var mı? (İsimden kontrol ediyoruz)
                const checkRes = await db.query('SELECT id FROM movies WHERE title = $1', [movie.title]);
                
                if (checkRes.rows.length === 0) {
                    // 2. Yoksa ekle
                    const insertQuery = `
                        INSERT INTO movies (title, description, duration_minutes, release_date, poster_url)
                        VALUES ($1, $2, $3, $4, $5)
                    `;
                    await db.query(insertQuery, [
                        movie.title, 
                        movie.description, 
                        movie.durationMinutes, 
                        movie.releaseDate, 
                        movie.posterUrl
                    ]);
                    addedCount++;
                }
            }

            console.log(`[CRON] Senkronizasyon tamamlandı! Eklenen yeni film sayısı: ${addedCount}`);
            
        } catch (error) {
            console.error('[CRON ERROR] Film senkronizasyonu sırasında hata oluştu:', error.message);
        }
    }
}

module.exports = new SyncMoviesJob();
