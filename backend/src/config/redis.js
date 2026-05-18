const { createClient } = require('redis');

class RedisClient {
  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.client.on('error', (err) => console.log('Redis Client Error', err));
    this.client.on('connect', () => console.log('Redis Client Connected'));
  }

  async connect() {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  getClient() {
    return this.client;
  }
}

module.exports = new RedisClient();
