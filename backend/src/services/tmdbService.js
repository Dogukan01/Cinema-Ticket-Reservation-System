const axios = require('axios');
const fs = require('fs');
const path = require('path');

class TMDBService {
    /**
     * Kaggle'dan indirilip JSON'a çevrilmiş IMDB Top 1000 filmlerini mock data (fallback) olarak getirir.
     */
    getFallbackMovies() {
        try {
            const dataPath = path.join(__dirname, '../data/movies.json');
            const fileContent = fs.readFileSync(dataPath, 'utf-8');
            const movies = JSON.parse(fileContent);
            return movies.slice(0, 30);
        } catch (error) {
            console.error('[TMDB ERROR] Fallback JSON okunamadı:', error.message);
            return [];
        }
    }

    /**
     * Vizyondaki filmleri gerçek TMDB API'sinden getirir.
     */
    async getNowPlayingMovies() {
        const apiKey = process.env.TMDB_API_KEY;
        
        if (!apiKey || apiKey === 'YOUR_TMDB_API_KEY_HERE') {
            console.warn('[TMDB WARNING] TMDB_API_KEY bulunamadı. JSON (Fallback) veriler kullanılıyor...');
            return this.getFallbackMovies();
        }

        try {
            console.log('[TMDB] Gerçek API isteği yapılıyor...');
            const response = await axios.get(`https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=tr-TR&page=1`);
            
            // TMDB'den gelen verileri kendi veritabanı modelimize uygun formata çeviriyoruz
            const mappedMovies = response.data.results.map(movie => ({
                title: movie.title,
                description: movie.overview || 'Özet bulunmuyor.',
                durationMinutes: 120, // Now Playing uç noktası süre vermez
                releaseDate: movie.release_date,
                posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster'
            }));

            return mappedMovies;
        } catch (error) {
            console.error('[TMDB ERROR]', error.message, '- JSON verilere (Fallback) dönülüyor...');
            return this.getFallbackMovies();
        }
    }
}

module.exports = new TMDBService();
