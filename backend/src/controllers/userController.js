const db = require('../config/db');

class UserController {
    async getProfile(req, res, next) {
        try {
            const userId = req.user.id;
            
            // Get user info
            const userRes = await db.query('SELECT id, first_name, last_name, email, role, created_at FROM users WHERE id = $1', [userId]);
            if (userRes.rows.length === 0) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
            
            const user = userRes.rows[0];

            // Get past tickets
            const ticketsQuery = `
                SELECT 
                    t.id as ticket_id, t.seat_id, t.status, t.price, t.ticket_type, t.created_at,
                    s.start_time, m.title as movie_title, m.poster_url, h.name as hall_name, c.name as cinema_name
                FROM tickets t
                JOIN showtimes s ON t.showtime_id = s.id
                JOIN movies m ON s.movie_id = m.id
                JOIN halls h ON s.hall_id = h.id
                JOIN cinemas c ON h.cinema_id = c.id
                WHERE t.user_id = $1 AND t.status IN ('CONFIRMED', 'CANCELLED')
                ORDER BY t.created_at DESC
            `;
            const ticketsRes = await db.query(ticketsQuery, [userId]);
            
            res.json({
                user,
                tickets: ticketsRes.rows
            });
        } catch (error) {
            next(error);
        }
    }
}
module.exports = new UserController();
