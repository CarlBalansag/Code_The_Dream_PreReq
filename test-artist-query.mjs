import dotenv from 'dotenv';
import { connectToDB } from './src/lib/mongodb.js';
import { Play } from './src/lib/models/Play.js';

dotenv.config({ path: '.env.local' });

async function testArtistQuery() {
  console.log('🔍 Testing artist query...\n');

  try {
    await connectToDB();

    // Get a sample artist from database
    const samplePlay = await Play.findOne({ artistId: { $ne: null } })
      .select('artistId artistName userId');

    if (!samplePlay) {
      console.log('❌ No plays with artistId found');
      process.exit(1);
    }

    console.log('📊 Sample Play:');
    console.log(`   Artist: ${samplePlay.artistName}`);
    console.log(`   Artist ID: ${samplePlay.artistId}`);
    console.log(`   User ID: ${samplePlay.userId}\n`);

    // Test aggregation query
    const userId = samplePlay.userId;
    const artistId = samplePlay.artistId;
    const localTimezone = 'America/Los_Angeles';

    console.log('🔄 Running aggregation...\n');

    const dailyPlays = await Play.aggregate([
      {
        $match: {
          userId,
          playedAt: {
            $gte: new Date('2025-10-01'),
            $lte: new Date('2025-10-31')
          }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$playedAt", timezone: localTimezone } }
          },
          totalSongs: { $sum: 1 },
          artistSongs: {
            $sum: {
              $cond: [{ $eq: ["$artistId", artistId] }, 1, 0]
            }
          }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    console.log('✅ Results:\n');
    dailyPlays.forEach(day => {
      console.log(`   ${day._id.date}: Total=${day.totalSongs}, Artist=${day.artistSongs}`);
    });

    if (dailyPlays.length === 0) {
      console.log('   No plays found in October 2025');
    }

    // Check if artist songs are showing
    const hasArtistPlays = dailyPlays.some(day => day.artistSongs > 0);

    if (hasArtistPlays) {
      console.log('\n✅ Artist filtering is WORKING!');
    } else {
      console.log('\n❌ Artist filtering is NOT working - all artistSongs = 0');

      // Debug: Check what artistIds exist for this day
      console.log('\n🔍 Debugging - checking artistIds on Oct 14-15:');
      const debugPlays = await Play.find({
        userId,
        playedAt: { $gte: new Date('2025-10-14'), $lte: new Date('2025-10-16') }
      }).select('artistId artistName playedAt').limit(10);

      debugPlays.forEach(p => {
        console.log(`   ${p.artistName}: artistId="${p.artistId}"`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testArtistQuery();
