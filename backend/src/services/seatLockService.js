const redis = require('../config/redis');

class SeatLockService {
  constructor() {
    this.LOCK_TTL = 600; // 10 dakika (saniye cinsinden)
    this.LOCK_PREFIX = 'seat_lock:';
  }

  /**
   * Koltuğu belirli bir kullanıcı (veya session) için kilitler (Optimistic Locking).
   * @param {string} showtimeId - Seans ID'si
   * @param {string} seatId - Koltuk ID'si
   * @param {string} userId - Kilitleyen kullanıcının ID'si
   * @returns {Promise<boolean>} Kilit başarılıysa true, değilse (zaten kilitliyse) false
   */
  async lockSeat(showtimeId, seatId, userId) {
    await redis.connect();
    const client = redis.getClient();
    const lockKey = `${this.LOCK_PREFIX}${showtimeId}:${seatId}`;

    // SET NX (Not eXists) - Yalnızca anahtar yoksa ayarlar
    // EX - Belirtilen saniye kadar (TTL) tutar
    const result = await client.set(lockKey, userId, {
      NX: true,
      EX: this.LOCK_TTL
    });

    // Eğer result 'OK' ise kilit bizimdir, null ise başkası tarafından kilitlenmiştir.
    return result === 'OK';
  }

  /**
   * Kullanıcının kilitlediği koltuğun kilidini açar (İşlem iptal edildiğinde veya tamamlandığında).
   * @param {string} showtimeId - Seans ID'si
   * @param {string} seatId - Koltuk ID'si
   * @param {string} userId - Kilidi açmaya çalışan kullanıcının ID'si
   * @returns {Promise<boolean>} Kilit başarıyla açıldıysa true, aksi halde false
   */
  async unlockSeat(showtimeId, seatId, userId) {
    await redis.connect();
    const client = redis.getClient();
    const lockKey = `${this.LOCK_PREFIX}${showtimeId}:${seatId}`;

    // Kilidi sadece sahibi (userId) açabilmeli. Bunun için Lua script kullanıyoruz (Atomik işlem).
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    const result = await client.eval(script, {
      keys: [lockKey],
      arguments: [userId]
    });

    return result === 1;
  }
}

module.exports = new SeatLockService();
