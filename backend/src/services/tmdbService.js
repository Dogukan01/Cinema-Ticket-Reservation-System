const axios = require('axios');

class TMDBService {
    /**
     * Vizyondaki filmleri gerçek TMDB API'sinden getirir.
     */
    async getNowPlayingMovies() {
        const apiKey = process.env.TMDB_API_KEY;
        
        const mockData = [
            {
                title: 'Dune: Part Two',
                description: 'Paul Atreides, Fremenler ile birleşerek ailesini yok eden komploculara karşı savaş açar.',
                durationMinutes: 166,
                releaseDate: '2024-03-01',
                posterUrl: 'https://image.tmdb.org/t/p/w500/8b8R8l88ILjqZWbHvtxORHnqg6f.jpg'
            },
            {
                title: 'Oppenheimer',
                description: 'Amerikalı bilim insanı J. Robert Oppenheimer ve atom bombasının geliştirilme süreci.',
                durationMinutes: 180,
                releaseDate: '2023-07-21',
                posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gP5dGf6385K5H6juRxmYym.jpg'
            },
            {
                title: 'Deadpool & Wolverine',
                description: 'Deadpool, Wolverine ile birlikte çoklu evrenleri kurtarmaya çalışır.',
                durationMinutes: 127,
                releaseDate: '2024-07-26',
                posterUrl: 'https://image.tmdb.org/t/p/w500/9b9X11k0aBebYt5b2w3c67Gv3o7.jpg'
            }
        ];

        if (!apiKey) {
            console.warn('[TMDB WARNING] TMDB_API_KEY bulunamadı. Mock veriler kullanılıyor...');
            return mockData;
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
            console.error('[TMDB ERROR]', error.message, '- Mock verilere (Fallback) dönülüyor...');
            return mockData;
        }
    }
}

module.exports = new TMDBService();
