require('dotenv').config();
const db = require('./src/config/db');

async function main() {
    const tables = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    console.log('TABLES:', tables.rows.map(r => r.table_name));
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
