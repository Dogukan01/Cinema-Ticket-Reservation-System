require('dotenv').config();
const db = require('./config/db');

async function testConnection() {
  try {
    console.log('PostgreSQL bağlantısı sınanıyor...');
    // Veritabanına basit bir sorgu atarak bağlantıyı test ediyoruz
    const res = await db.query('SELECT NOW() AS current_time');
    
    console.log('✅ PostgreSQL Bağlantı Testi Başarılı!');
    console.log('⏳ Sunucu Zamanı:', res.rows[0].current_time);
    
    // Bağlantı başarılıysa process sonlandırılır (Sadece test scripti olduğu için)
    process.exit(0);
  } catch (error) {
    console.error('❌ Veritabanı bağlantı hatası:', error.message);
    process.exit(1);
  }
}

testConnection();
