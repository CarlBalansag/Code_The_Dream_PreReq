// Database Health Check Script
import dotenv from 'dotenv';
import { connectToDB, getConnectionStatus } from './src/lib/mongodb.js';
import { User } from './src/lib/models/User.js';
import { Play } from './src/lib/models/Play.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function checkDatabase() {
  console.log('🏥 Database Health Check\n');
  console.log('━'.repeat(50));

  try {
    // 1. Check environment variables
    console.log('\n📋 Environment Variables:');
    console.log('  MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
    console.log('  MONGODB_DB_NAME:', process.env.MONGODB_DB_NAME || '❌ Missing');

    // 2. Test connection
    console.log('\n🔌 Testing Connection...');
    await connectToDB();
    const status = getConnectionStatus();
    console.log('  Status:', status.isConnected ? '✅ Connected' : '❌ Disconnected');
    console.log('  Ready State:', status.readyState, '(1 = connected)');

    // 3. Check collections
    console.log('\n📦 Collections:');
    const db = (await import('mongoose')).default.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(`  Found ${collections.length} collections:`);
    collections.forEach(col => {
      console.log(`    - ${col.name}`);
    });

    // 4. Check User model
    console.log('\n👥 User Collection:');
    const userCount = await User.countDocuments();
    console.log(`  Total users: ${userCount}`);

    if (userCount > 0) {
      const recentUsers = await User.find()
        .select('displayName email spotifyId createdAt')
        .sort({ createdAt: -1 })
        .limit(3);

      console.log('  Recent users:');
      recentUsers.forEach((user, i) => {
        console.log(`    ${i + 1}. ${user.displayName} (${user.email || 'no email'})`);
        console.log(`       Spotify ID: ${user.spotifyId}`);
        console.log(`       Created: ${user.createdAt}`);
      });
    }

    // 5. Check Play model
    console.log('\n🎵 Play Collection:');
    const playCount = await Play.countDocuments();
    console.log(`  Total plays: ${playCount}`);

    if (playCount > 0) {
      const recentPlays = await Play.find()
        .select('trackName artistName playedAt userId')
        .sort({ playedAt: -1 })
        .limit(5);

      console.log('  Recent plays:');
      recentPlays.forEach((play, i) => {
        console.log(`    ${i + 1}. "${play.trackName}" by ${play.artistName || 'Unknown Artist'}`);
        console.log(`       Played at: ${play.playedAt}`);
      });
    }

    // 6. Database statistics
    console.log('\n📊 Database Statistics:');
    const stats = await db.stats();
    console.log(`  Database size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Storage size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Indexes: ${stats.indexes}`);
    console.log(`  Collections: ${stats.collections}`);

    console.log('\n━'.repeat(50));
    console.log('✅ Database health check complete!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Health check failed!');
    console.error('Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

checkDatabase();
