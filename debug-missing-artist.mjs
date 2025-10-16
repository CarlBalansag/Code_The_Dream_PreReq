import dotenv from 'dotenv';
import { connectToDB } from './src/lib/mongodb.js';
import { Play } from './src/lib/models/Play.js';

dotenv.config({ path: '.env.local' });

async function debugMissingArtist() {
  console.log('🔍 Debugging missing artist data...\n');

  try {
    await connectToDB();

    const userId = '31a7kjlfykjlyxfdq7cqa4ywsrgu';

    // Get unique artists from database
    console.log('📊 Getting unique artists from database...\n');

    const uniqueArtists = await Play.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: {
            artistId: '$artistId',
            artistName: '$artistName'
          },
          playCount: { $sum: 1 },
          firstPlay: { $min: '$playedAt' },
          lastPlay: { $max: '$playedAt' }
        }
      },
      { $sort: { playCount: -1 } },
      { $limit: 20 }
    ]);

    console.log(`Found ${uniqueArtists.length} unique artists in database:\n`);

    uniqueArtists.forEach((artist, i) => {
      console.log(`${i + 1}. ${artist._id.artistName}`);
      console.log(`   Artist ID: ${artist._id.artistId || 'null'}`);
      console.log(`   Plays: ${artist.playCount}`);
      console.log(`   First Play: ${artist.firstPlay.toLocaleDateString()}`);
      console.log(`   Last Play: ${artist.lastPlay.toLocaleDateString()}`);
      console.log('');
    });

    // Check how many artists have null artistId
    const nullArtistIdCount = uniqueArtists.filter(a => !a._id.artistId).length;
    const hasArtistIdCount = uniqueArtists.filter(a => a._id.artistId).length;

    console.log('━'.repeat(50));
    console.log(`\n📈 Summary:`);
    console.log(`   Artists with artistId: ${hasArtistIdCount}`);
    console.log(`   Artists with null artistId: ${nullArtistIdCount}`);
    console.log('');
    console.log('💡 Issue:');
    console.log('   - Spotify Top Artists returns artists with artistId');
    console.log('   - But imported data might have null artistId');
    console.log('   - When you click an artist, it searches by artistId');
    console.log('   - If artistId is null in DB, it tries to match by name\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugMissingArtist();
