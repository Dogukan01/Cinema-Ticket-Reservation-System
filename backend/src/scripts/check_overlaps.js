const db = require('../config/db');

async function check() {
  try {
    const totalCountRes = await db.query('SELECT COUNT(*) FROM showtimes');
    console.log(`Total showtimes: ${totalCountRes.rows[0].count}`);

    // Print movie showtimes count
    const movieCountsRes = await db.query(`
      SELECT m.title, COUNT(s.id) as session_count
      FROM movies m
      LEFT JOIN showtimes s ON s.movie_id = m.id
      GROUP BY m.id, m.title
      ORDER BY session_count DESC;
    `);
    console.log('\nShowtime distribution per movie:');
    for (const r of movieCountsRes.rows) {
      console.log(`- ${r.title}: ${r.session_count} sessions`);
    }
    console.log('');

    // Count identical start times
    const identicalRes = await db.query(`
      SELECT s.hall_id, s.start_time, COUNT(*), string_agg(m.title, ', ') as movies
      FROM showtimes s
      JOIN movies m ON s.movie_id = m.id
      GROUP BY s.hall_id, s.start_time 
      HAVING COUNT(*) > 1;
    `);
    
    console.log(`Found ${identicalRes.rowCount} groups of identical start times in same hall!`);
    for (const r of identicalRes.rows) {
      console.log(`Hall: ${r.hall_id}, Start: ${r.start_time.toISOString()}, Count: ${r.count}, Movies: ${r.movies}`);
    }

    // Check for overlapping intervals (non-identical but overlapping)
    const overlapRes = await db.query(`
      SELECT s1.hall_id, s1.start_time as s1_start, s1.end_time as s1_end, m1.title as m1_title,
             s2.start_time as s2_start, s2.end_time as s2_end, m2.title as m2_title
      FROM showtimes s1
      JOIN showtimes s2 ON s1.hall_id = s2.hall_id AND s1.id < s2.id
      JOIN movies m1 ON s1.movie_id = m1.id
      JOIN movies m2 ON s2.movie_id = m2.id
      WHERE NOT (s1.end_time <= s2.start_time OR s1.start_time >= s2.end_time)
      LIMIT 10;
    `);
    console.log(`Found overlapping interval samples (up to 10): ${overlapRes.rowCount}`);
    for (const r of overlapRes.rows) {
      console.log(`Hall: ${r.hall_id}`);
      console.log(`  Movie 1: ${r.m1_title} (${r.s1_start.toISOString()} - ${r.s1_end.toISOString()})`);
      console.log(`  Movie 2: ${r.m2_title} (${r.s2_start.toISOString()} - ${r.s2_end.toISOString()})`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await db.pool.end();
    console.log('Database connection pool closed.');
  }
}

check();
