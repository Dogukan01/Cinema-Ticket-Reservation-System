require('dotenv').config({ path: '../../.env' }); // Doğru yoldan oku
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function runMigration() {
    console.log('Veritabanı migration başlatıldı...');
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        // SQL dosyasını çalıştır
        await db.query(sql);
        console.log('✅ Tablolar başarıyla oluşturuldu!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration hatası:', err.message);
        process.exit(1);
    }
}

runMigration();
