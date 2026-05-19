const { createClient } = require('redis');

class RedisClient {
  constructor() {
    this.available = false;
    this._connectPromise = null; // Tüm eşzamanlı çağrılar bu promise'i bekler
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: { reconnectStrategy: false }
    });

    // Hataları promise içinde zaten yakalıyoruz
    this.client.on('error', () => {});
  }

  async connect() {
    // Zaten bağlıysa anında dön
    if (this.client.isOpen) return;

    // Bağlantı devam ediyorsa aynı promise'i bekle (race condition önlemi)
    if (this._connectPromise) return this._connectPromise;

    this._connectPromise = this.client.connect()
      .then(() => {
        this.available = true;
        console.log('✅ Redis Client Connected');
      })
      .catch(() => {
        this.available = false;
        console.warn('⚠️  Redis bağlanamadı, önbelleksiz devam ediliyor. (REDIS_URL ile aktif edebilirsiniz)');
      });

    return this._connectPromise;
  }

  isAvailable() {
    return this.available && this.client.isOpen;
  }

  getClient() {
    return this.client;
  }
}

module.exports = new RedisClient();

