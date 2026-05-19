const cron = require('node-cron');
const db = require('../config/db');

class CleanupPendingTicketsJob {
    start() {
        // Her 2 dakikada bir çalışacak
        cron.schedule('*/2 * * * *', async () => {
            console.log(`[CRON] ${new Date().toISOString()} - Süresi dolmuş bekleyen (PENDING) biletleri temizleme işlemi başlatılıyor...`);
            await this.cleanupTickets();
        });
    }

    async cleanupTickets() {
        try {
            // 15 dakikadan daha eski olan PENDING statüsündeki biletleri sil
            // Böylece koltuklar "unique_seat_showtime" kısıtlamasından kurtulur ve tekrar satılabilir
            const query = `
                DELETE FROM tickets 
                WHERE status = 'PENDING' 
                AND created_at < NOW() - INTERVAL '15 minutes'
            `;
            
            const result = await db.query(query);

            if (result.rowCount > 0) {
                console.log(`[CRON] ${result.rowCount} adet süresi dolmuş PENDING bilet silindi ve koltuklar serbest bırakıldı.`);
            }
        } catch (error) {
            console.error('[CRON ERROR] PENDING bilet temizliği sırasında hata:', error.message);
        }
    }
}

module.exports = new CleanupPendingTicketsJob();
