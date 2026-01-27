/**
 * Check if Supabase database has data
 * This will help determine if we need to migrate from MongoDB
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSupabaseData() {
  try {
    console.log('🔍 Checking Supabase database...\n');

    // Check plays count
    const playsCount = await prisma.plays.count();
    console.log(`📊 Plays: ${playsCount.toLocaleString()}`);

    // Check users count
    const usersCount = await prisma.users.count();
    console.log(`👤 Users: ${usersCount}`);

    // Check import_jobs count
    const importJobsCount = await prisma.import_jobs.count();
    console.log(`📥 Import Jobs: ${importJobsCount}`);

    // Check tracks count
    const tracksCount = await prisma.tracks.count();
    console.log(`🎵 Tracks: ${tracksCount.toLocaleString()}`);

    // Check artists count
    const artistsCount = await prisma.artists.count();
    console.log(`🎤 Artists: ${artistsCount.toLocaleString()}`);

    // Check albums count
    const albumsCount = await prisma.albums.count();
    console.log(`💿 Albums: ${albumsCount.toLocaleString()}`);

    console.log('\n' + '='.repeat(50));

    if (playsCount === 0) {
      console.log('❌ Supabase database is EMPTY - Migration needed from MongoDB');
      console.log('   We have 111,842 plays in MongoDB that need to be migrated');
    } else {
      console.log('✅ Supabase database has data - No migration needed');
      console.log('   Just need to restore Prisma client code');
    }

  } catch (error) {
    console.error('❌ Error checking Supabase:', error.message);

    if (error.code === 'P1001') {
      console.error('\n💡 Cannot connect to Supabase database');
      console.error('   Check DATABASE_URL in .env.local');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkSupabaseData();
