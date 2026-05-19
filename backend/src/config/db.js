const { Pool } = require('pg');
require('dotenv').config();

let pool;

if (process.env.DATABASE_URL) {
  // NeonDB / Cloud PostgreSQL
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
} else {
  // Yerel PostgreSQL
  pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'sbrs_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
    ssl: false
  });
}

pool.on('connect', () => {
  console.log('PostgreSQL Veritabanına başarıyla bağlanıldı.');
});

pool.on('error', (err) => {
  console.error('PostgreSQL Beklenmeyen Hata (Bağlantı Koptu):', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};