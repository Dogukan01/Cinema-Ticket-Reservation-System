const redis = require('../config/redis');

class SeatLockService {
  constructor() {
    this.LOCK_TTL = 600; // 10 dakika (saniye cinsinden)
    this.LOCK_PREFIX = 'seat_lock:';
  }

  /**
   * Koltuğu belirli bir kullanıcı (veya session) için kilitler.
   * Redis yoksa true döner — DB unique constraint çift satışı engeller.
   */
  async lockSeat(showtimeId, seatId, userId) {
    await redis.connect();

    if (!redis.isAvailable()) {
      // Redis yok → kilitsiz devam, DB korur
      return true;
    }

    const client = redis.getClient();
    const lockKey = `${this.LOCK_PREFIX}${showtimeId}:${seatId}`;

    // SET NX: Yalnızca anahtar yoksa ayarlar → 'OK' veya null
    const result = await client.set(lockKey, userId, {
      NX: true,
      EX: this.LOCK_TTL
    });

    return result === 'OK';
  }

  /**
   * Kullanıcının kilitlediği koltuğun kilidini açar.
   * Redis yoksa true döner (kilit zaten yoktur).
   */
  async unlockSeat(showtimeId, seatId, userId) {
    await redis.connect();

    if (!redis.isAvailable()) {
      return true;
    }

    const client = redis.getClient();
    const lockKey = `${this.LOCK_PREFIX}${showtimeId}:${seatId}`;

    // Kilidi sadece sahibi açabilmeli (Atomik Lua script)
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
