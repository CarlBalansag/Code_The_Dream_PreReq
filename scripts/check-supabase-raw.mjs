/**
 * Check Supabase database using raw SQL (no Prisma)
 */

import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;

async function checkSupabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase\n');

    // Check plays
    const playsResult = await client.query('SELECT COUNT(*) FROM plays');
    const playsCount = parseInt(playsResult.rows[0].count);
    console.log(`📊 Plays: ${playsCount.toLocaleString()}`);

    // Check users
    const usersResult = await client.query('SELECT COUNT(*) FROM users');
    const usersCount = parseInt(usersResult.rows[0].count);
    console.log(`👤 Users: ${usersCount}`);

    // Check import_jobs
    const jobsResult = await client.query('SELECT COUNT(*) FROM import_jobs');
    const jobsCount = parseInt(jobsResult.rows[0].count);
    console.log(`📥 Import Jobs: ${jobsCount}`);

    // Check tracks
    const tracksResult = await client.query('SELECT COUNT(*) FROM tracks');
    const tracksCount = parseInt(tracksResult.rows[0].count);
    console.log(`🎵 Tracks: ${tracksCount.toLocaleString()}`);

    // Check artists
    const artistsResult = await client.query('SELECT COUNT(*) FROM artists');
    const artistsCount = parseInt(artistsResult.rows[0].count);
    console.log(`🎤 Artists: ${artistsCount.toLocaleString()}`);

    // Check albums
    const albumsResult = await client.query('SELECT COUNT(*) FROM albums');
    const albumsCount = parseInt(albumsResult.rows[0].count);
    console.log(`💿 Albums: ${albumsCount.toLocaleString()}`);

    console.log('\n' + '='.repeat(50));

    if (playsCount === 0) {
      console.log('❌ Supabase database is EMPTY');
      console.log('   Migration needed from MongoDB (111,842 plays)');
    } else {
      console.log('✅ Supabase database has data');
      console.log('   Just need to restore Prisma client code');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSupabase();
