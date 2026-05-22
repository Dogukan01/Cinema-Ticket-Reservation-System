require('dotenv').config();
const db = require('../config/db');
const syncMoviesJob = require('../jobs/syncMoviesJob');

async function testSync() {
    try {
        console.log('--- ADIM 1: Veritabanı Durum Kontrolü ---');
        const moviesRes = await db.query('SELECT id, title, release_date FROM movies LIMIT 5');
        console.log('Veritabanındaki ilk 5 film:');
        for (const r of moviesRes.rows) {
            const countRes = await db.query('SELECT COUNT(*) FROM showtimes WHERE movie_id = $1', [r.id]);
            console.log(`- ${r.title} (Yayın: ${r.release_date.toISOString().split('T')[0]}, Seans Sayısı: ${countRes.rows[0].count})`);
        }

        const targetMovie = moviesRes.rows[0];
        console.log(`\nHedef film seçildi: ${targetMovie.title}`);

        console.log('\n--- ADIM 2: Hedef Filmin Seanslarını Silme ---');
        const deleteRes = await db.query('DELETE FROM showtimes WHERE movie_id = $1', [targetMovie.id]);
        console.log(`${targetMovie.title} için ${deleteRes.rowCount} seans silindi.`);

        const checkBeforeRes = await db.query('SELECT COUNT(*) FROM showtimes WHERE movie_id = $1', [targetMovie.id]);
        console.log(`Silme sonrası seans sayısı: ${checkBeforeRes.rows[0].count}`);

        console.log('\n--- ADIM 3: Film Senkronizasyonunu Çalıştırma ---');
        await syncMoviesJob.syncMovies();

        console.log('\n--- ADIM 4: Sonuç Doğrulama ---');
        const checkAfterRes = await db.query('SELECT COUNT(*) FROM showtimes WHERE movie_id = $1', [targetMovie.id]);
        console.log(`Senkronizasyon sonrası seans sayısı: ${checkAfterRes.rows[0].count}`);

        if (parseInt(checkAfterRes.rows[0].count) > 0) {
            console.log('✅ BAŞARILI: Seansı kalmayan filme otomatik seanslar oluşturuldu!');
        } else {
            console.log('❌ HATA: Otomatik seans oluşturulamadı.');
        }

        console.log('\n--- ADIM 5: Listeden Kalkan Filmlerin Seanslarını Temizleme Testi ---');
        // Veritabanına geçici bir sahte film ekleyelim
        const fakeMovieRes = await db.query(
            "INSERT INTO movies (title, description, duration_minutes, release_date, poster_url) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (title) DO UPDATE SET title = EXCLUDED.title RETURNING id",
            ['Geçici Sahte Film', 'Test Açıklama', 120, '2026-05-01', 'http://test.com/poster.jpg']
        );
        const fakeMovieId = fakeMovieRes.rows[0].id;
        console.log(`Sahte film veritabanına eklendi (ID: ${fakeMovieId})`);

        // Bu filme seanslar oluşturalım
        await syncMoviesJob.generateShowtimesForMovie(fakeMovieId, 120);
        const fakeShowtimesCountRes = await db.query('SELECT COUNT(*) FROM showtimes WHERE movie_id = $1', [fakeMovieId]);
        console.log(`Sahte filme oluşturulan seans sayısı: ${fakeShowtimesCountRes.rows[0].count}`);

        console.log('Film senkronizasyonu tekrar çalıştırılıyor. Sahte film TMDB listesinde olmayacağı için seansları temizlenmeli...');
        await syncMoviesJob.syncMovies();

        const fakeShowtimesCountAfterRes = await db.query('SELECT COUNT(*) FROM showtimes WHERE movie_id = $1', [fakeMovieId]);
        console.log(`Senkronizasyon sonrası sahte film seans sayısı: ${fakeShowtimesCountAfterRes.rows[0].count}`);

        if (parseInt(fakeShowtimesCountAfterRes.rows[0].count) === 0) {
            console.log('✅ BAŞARILI: Listeden kalkan filmlerin seansları başarıyla temizlendi!');
        } else {
            console.log('❌ HATA: Listeden kalkan filmlerin seansları temizlenemedi.');
        }

        // Temizlik: sahte filmi silelim
        await db.query('DELETE FROM movies WHERE id = $1', [fakeMovieId]);
        console.log('Geçici sahte film veritabanından silindi.');

        console.log('\n--- ADIM 6: Sinema İsimlerinin SBRS Olarak Değişmesi Doğrulaması ---');
        const paribuCinemas = await db.query("SELECT COUNT(*) FROM cinemas WHERE name LIKE '%Paribu%'");
        const sbrsCinemas = await db.query("SELECT COUNT(*) FROM cinemas WHERE name LIKE '%SBRS%'");
        console.log(`'Paribu' içeren sinema sayısı: ${paribuCinemas.rows[0].count}`);
        console.log(`'SBRS' içeren sinema sayısı: ${sbrsCinemas.rows[0].count}`);
        if (parseInt(paribuCinemas.rows[0].count) === 0 && parseInt(sbrsCinemas.rows[0].count) > 0) {
            console.log('✅ BAŞARILI: Sinema isimlerinden Paribu kaldırılıp SBRS eklendi!');
        } else {
            console.log('❌ HATA: Sinema isim güncellemesi başarısız.');
        }

        await db.pool.end();
        console.log('Database connection closed.');
        process.exit(0);
    } catch (err) {
        console.error('Test hatası:', err);
        process.exit(1);
    }
}

testSync();
