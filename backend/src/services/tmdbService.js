// const axios = require('axios'); // Gerçek API için eklendi ancak şu an Mock kullanıyoruz.

class TMDBService {
    /**
     * Vizyondaki filmleri getirir. 
     * Eğer .env dosyasında TMDB_API_KEY olsaydı axios ile gerçek istek atılacaktı.
     * Şu an için Mock (Sahte) veri dönüyoruz.
     */
    async getNowPlayingMovies() {
        // Gerçek Senaryo Örneği:
        // const response = await axios.get(`https://api.themoviedb.org/3/movie/now_playing?api_key=${process.env.TMDB_API_KEY}`);
        // return response.data.results;
        
        console.log('[TMDB] Vizyondaki filmler için Mock API isteği yapılıyor...');
        
        return [
            {
                title: 'Dune: Part Two',
                description: 'Paul Atreides, Fremenler ile birleşerek ailesini yok eden komploculara karşı savaş açar.',
                durationMinutes: 166,
                releaseDate: '2024-03-01',
                posterUrl: 'https://image.tmdb.org/t/p/w500/dune2_poster.jpg'
            },
            {
                title: 'Oppenheimer',
                description: 'Amerikalı bilim insanı J. Robert Oppenheimer ve atom bombasının geliştirilme süreci.',
                durationMinutes: 180,
                releaseDate: '2023-07-21',
                posterUrl: 'https://image.tmdb.org/t/p/w500/oppenheimer_poster.jpg'
            },
            {
                title: 'Deadpool & Wolverine',
                description: 'Deadpool, Wolverine ile birlikte çoklu evrenleri kurtarmaya çalışır.',
                durationMinutes: 127,
                releaseDate: '2024-07-26',
                posterUrl: 'https://image.tmdb.org/t/p/w500/deadpool_poster.jpg'
            }
        ];
    }
}

module.exports = new TMDBService();
