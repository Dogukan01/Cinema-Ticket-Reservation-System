const db = require('../config/db');

class AdminController {
    // Tüm müşterileri getirir
    async getCustomers(req, res, next) {
        try {
            const query = `
                SELECT id, first_name, last_name, email, identity_number, created_at 
                FROM users 
                WHERE role = 'customer'
                ORDER BY created_at DESC
            `;
            const result = await db.query(query);
            res.json(result.rows);
        } catch (error) {
            next(error);
        }
    }

    // Son satılan biletleri / Satış istatistiklerini getirir
    async getSalesStats(req, res, next) {
        try {
            const totalSalesQuery = `SELECT SUM(price) as total_revenue FROM tickets WHERE status = 'CONFIRMED'`;
            const totalTicketsQuery = `SELECT COUNT(*) as ticket_count FROM tickets WHERE status = 'CONFIRMED'`;
            
            const recentTicketsQuery = `
                SELECT t.id, u.first_name, u.last_name, t.price, t.status, t.created_at, m.title as movie_title
                FROM tickets t
                LEFT JOIN users u ON t.user_id = u.id
                JOIN showtimes s ON t.showtime_id = s.id
                JOIN movies m ON s.movie_id = m.id
                ORDER BY t.created_at DESC
                LIMIT 10
            `;

            const [salesRes, countRes, recentRes] = await Promise.all([
                db.query(totalSalesQuery),
                db.query(totalTicketsQuery),
                db.query(recentTicketsQuery)
            ]);

            res.json({
                totalRevenue: salesRes.rows[0].total_revenue || 0,
                totalTickets: countRes.rows[0].ticket_count || 0,
                recentTickets: recentRes.rows
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminController();
