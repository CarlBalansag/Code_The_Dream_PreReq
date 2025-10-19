import dotenv from 'dotenv';
import { connectToDB } from './src/lib/mongodb.js';
import { Play } from './src/lib/models/Play.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function checkArtistIds() {
  console.log('🔍 Checking artistId values in database...\n');

  try {
    await connectToDB();

    // Get sample plays
    const plays = await Play.find()
      .limit(10)
      .select('trackName artistName artistId playedAt')
      .sort({ playedAt: -1 });

    console.log('📊 Sample plays from database:\n');
    plays.forEach((play, i) => {
      console.log(`${i + 1}. Track: "${play.trackName}"`);
      console.log(`   Artist Name: "${play.artistName}"`);
      console.log(`   Artist ID: ${play.artistId === null ? 'null' : `"${play.artistId}"`}`);
      console.log(`   Played At: ${play.playedAt}`);
      console.log('');
    });

    // Count how many plays have null artistId
    const totalPlays = await Play.countDocuments();
    const nullArtistIds = await Play.countDocuments({ artistId: null });
    const hasArtistIds = totalPlays - nullArtistIds;

    console.log('━'.repeat(50));
    console.log('\n📈 Statistics:');
    console.log(`   Total plays: ${totalPlays}`);
    console.log(`   Plays with artistId: ${hasArtistIds}`);
    console.log(`   Plays with null artistId: ${nullArtistIds}`);
    console.log('');

    if (nullArtistIds > 0) {
      console.log('⚠️  WARNING: Some plays have null artistId!');
      console.log('   This is expected for imported JSON data.');
      console.log('   The artist chart query needs to use artistName instead of artistId.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkArtistIds();
