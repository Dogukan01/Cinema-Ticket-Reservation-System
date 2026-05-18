const axios = require('axios');

class TMDBService {
    /**
     * Vizyondaki filmleri gerçek TMDB API'sinden getirir.
     */
    async getNowPlayingMovies() {
        const apiKey = process.env.TMDB_API_KEY;
        
        if (!apiKey) {
            throw new Error('TMDB_API_KEY bulunamadı! Lütfen .env dosyasına TMDB_API_KEY ekleyin.');
        }

        console.log('[TMDB] Gerçek API isteği yapılıyor...');
        
        try {
            const response = await axios.get(`https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=tr-TR&page=1`);
            
            // TMDB'den gelen verileri kendi veritabanı modelimize uygun formata çeviriyoruz
            const mappedMovies = response.data.results.map(movie => ({
                title: movie.title,
                description: movie.overview || 'Özet bulunmuyor.',
                durationMinutes: 120, // Now Playing uç noktası süre vermez, sabit veya varsayılan atanabilir (veya /movie/{id} isteği atılabilir)
                releaseDate: movie.release_date,
                posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster'
            }));

            // Detaylı süre bilgisini almak için tek tek istek atmak API limitlerine takılabilir, şimdilik varsayılan 120 dakika atıyoruz.
            return mappedMovies;
        } catch (error) {
            console.error('[TMDB ERROR]', error.message);
            throw new Error('TMDB API\'sinden veriler çekilemedi.');
        }
    }
}

module.exports = new TMDBService();
