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
            
            // TMDB'den gelen her filmin detayına (süre bilgisi için) asenkron istek atıyoruz
            const mappedMovies = await Promise.all(response.data.results.slice(0, 15).map(async (movie) => {
                let durationMinutes = 120;
                try {
                    const detailRes = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${apiKey}`);
                    if (detailRes.data.runtime && detailRes.data.runtime > 0) {
                        durationMinutes = detailRes.data.runtime;
                    }
                } catch (err) {
                    console.warn(`[TMDB WARNING] Film detayı alınamadı (${movie.title}):`, err.message);
                }

                return {
                    title: movie.title,
                    description: movie.overview || 'Özet bulunmuyor.',
                    durationMinutes: durationMinutes,
                    releaseDate: movie.release_date,
                    posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster'
                };
            }));

            return mappedMovies;
        } catch (error) {
            console.error('[TMDB ERROR]', error.message, '- JSON verilere (Fallback) dönülüyor...');
            return this.getFallbackMovies();
        }
    }
    async enrichMovieDetails(title) {
        const apiKey = process.env.TMDB_API_KEY;
        if (!apiKey || apiKey === 'YOUR_TMDB_API_KEY_HERE') {
            return null;
        }

        try {
            // 1. Search movie by title
            const searchRes = await axios.get(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(title)}&language=tr-TR`);
            if (!searchRes.data.results || searchRes.data.results.length === 0) return null;

            const tmdbMovieId = searchRes.data.results[0].id;

            // 2. Fetch full details with videos & credits
            const detailRes = await axios.get(`https://api.themoviedb.org/3/movie/${tmdbMovieId}?api_key=${apiKey}&language=tr-TR&append_to_response=videos,credits`);
            const data = detailRes.data;

            // Extract director
            const director = data.credits?.crew?.find(c => c.job === 'Director')?.name || 'Bilinmiyor';

            // Extract cast (first 5 actors)
            const cast = data.credits?.cast?.slice(0, 5).map(c => c.name).join(', ') || 'Bilinmiyor';

            // Extract genres
            const genres = data.genres?.map(g => g.name).join(', ') || 'Bilinmiyor';

            // Extract trailer YouTube key
            const trailer = data.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube')?.key || null;

            return {
                backdropUrl: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : null,
                rating: data.vote_average ? data.vote_average.toFixed(1) : null,
                director,
                cast,
                genres,
                trailerKey: trailer
            };
        } catch (error) {
            console.error('[TMDB ERROR] enrichment failed for:', title, error.message);
            return null;
        }
    }
}

module.exports = new TMDBService();
