const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL Connection Pool Configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sbrs_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  
  // TLS 1.3 / SSL Entegrasyonu
  // Production ortamında (K8s üzerinde) veri trafiği mutlaka şifrelenmiş (SSL/TLS) olmalıdır.
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
  console.log('PostgreSQL Veritabanına başarıyla bağlanıldı.');
});

pool.on('error', (err) => {
  console.error('PostgreSQL Beklenmeyen Hata (Bağlantı Koptu):', err);
  process.exit(-1);
});

module.exports = {
  // query metodunu dışarı açarak doğrudan SQL sorguları çalıştırmamızı sağlar
  query: (text, params) => pool.query(text, params),
  pool
};
