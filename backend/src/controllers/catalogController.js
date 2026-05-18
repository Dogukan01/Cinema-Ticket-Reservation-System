const catalogService = require('../services/catalogService');

class CatalogController {
    // ==========================================
    // FİLMLER (MOVIES)
    // ==========================================
    async getMovies(req, res) {
        try {
            const movies = await catalogService.getMovies();
            res.json(movies);
        } catch (error) {
            console.error('Film getirme hatası:', error.message);
            res.status(500).json({ error: 'Filmler yüklenemedi.' });
        }
    }

    async addMovie(req, res) {
        try {
            const { title, durationMinutes } = req.body;
            if (!title || !durationMinutes) {
                return res.status(400).json({ error: 'Film adı ve süresi (dakika) zorunludur.' });
            }
            
            const movie = await catalogService.createMovie(req.body);
            res.status(201).json({ message: 'Film başarıyla eklendi.', movie });
        } catch (error) {
            console.error('Film ekleme hatası:', error.message);
            res.status(500).json({ error: 'Film eklenemedi.' });
        }
    }

    // ==========================================
    // SİNEMALAR VE SALONLAR
    // ==========================================
    async addCinema(req, res) {
        try {
            const { name, location } = req.body;
            if (!name || !location) {
                return res.status(400).json({ error: 'Sinema adı ve adresi zorunludur.' });
            }
            const cinema = await catalogService.createCinema(name, location);
            res.status(201).json({ message: 'Sinema şubesi başarıyla oluşturuldu.', cinema });
        } catch (error) {
            res.status(500).json({ error: 'Sinema eklenemedi.' });
        }
    }

    async addHall(req, res) {
        try {
            const { cinemaId, name, seatLayout, totalSeats } = req.body;
            if (!cinemaId || !name || !seatLayout || !totalSeats) {
                return res.status(400).json({ error: 'Eksik parametreler var (cinemaId, name, seatLayout, totalSeats).' });
            }
            const hall = await catalogService.createHall(cinemaId, name, seatLayout, totalSeats);
            res.status(201).json({ message: 'Salon başarıyla oluşturuldu.', hall });
        } catch (error) {
            res.status(500).json({ error: 'Salon eklenemedi.' });
        }
    }

    // ==========================================
    // SEANSLAR (SHOWTIMES)
    // ==========================================
    async addShowtime(req, res) {
        try {
            const { movieId, hallId, startTime, price } = req.body;
            if (!movieId || !hallId || !startTime || !price) {
                return res.status(400).json({ error: 'Eksik parametreler var (movieId, hallId, startTime, price).' });
            }
            
            // Çakışma algoritması catalogService içerisinde çalışır
            const showtime = await catalogService.createShowtime(movieId, hallId, startTime, price);
            res.status(201).json({ message: 'Seans başarıyla oluşturuldu.', showtime });
            
        } catch (error) {
            console.error('Seans Ekleme Hatası:', error.message);
            // Çakışma hataları için 409 (Conflict) dönüyoruz
            if (error.message.includes('Çakışma') || error.message.includes('çakışması')) {
                return res.status(409).json({ error: error.message });
            }
            res.status(500).json({ error: 'Seans eklenemedi.' });
        }
    }
}

module.exports = new CatalogController();
