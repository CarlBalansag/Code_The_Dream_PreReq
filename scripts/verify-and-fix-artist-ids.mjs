/**
 * Verify and fix artist IDs that were incorrectly matched
 * This script checks if the returned artist name matches the searched name
 */

import { MongoClient } from 'mongodb';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'SpotifyLocal_Dev';

async function verifyAndFixArtistIds() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const plays = db.collection('plays');
    const users = db.collection('users');

    // Get user token
    const user = await users.findOne({});
    if (!user?.spotifyAccessToken) {
      console.error('❌ No access token found');
      return;
    }

    const accessToken = user.spotifyAccessToken;

    // Find artists with mismatched IDs (where we have an ID but it might be wrong)
    const artistsToVerify = await plays.aggregate([
      { $match: { artistId: { $ne: null } } },
      { $group: {
        _id: { artistName: '$artistName', artistId: '$artistId' },
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } },
      { $limit: 100 }
    ]).toArray();

    console.log(`\n📊 Verifying ${artistsToVerify.length} artist/ID pairs...\n`);

    let fixed = 0;
    let correct = 0;
    let failed = 0;

    for (const [index, item] of artistsToVerify.entries()) {
      const artistName = item._id.artistName;
      const currentId = item._id.artistId;
      const playCount = item.count;

      try {
        // Fetch the artist from Spotify by ID to verify
        const response = await fetch(
          `https://api.spotify.com/v1/artists/${currentId}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!response.ok) {
          console.log(`[${index + 1}/${artistsToVerify.length}] ⚠️  ${artistName}: ID not found on Spotify`);
          failed++;
          continue;
        }

        const artistData = await response.json();
        const actualName = artistData.name;

        // Check if names match (case-insensitive, ignoring special characters)
        const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
        const namesMatch = normalize(artistName) === normalize(actualName);

        if (namesMatch) {
          console.log(`[${index + 1}/${artistsToVerify.length}] ✅ ${artistName}: Correct (${playCount} plays)`);
          correct++;
        } else {
          console.log(`[${index + 1}/${artistsToVerify.length}] ❌ MISMATCH: "${artistName}" has wrong ID`);
          console.log(`   Current ID points to: "${actualName}"`);
          console.log(`   Searching for correct ID...`);

          // Search for the correct artist
          const searchQuery = encodeURIComponent(artistName);
          const searchResponse = await fetch(
            `https://api.spotify.com/v1/search?q=${searchQuery}&type=artist&limit=5`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );

          if (searchResponse.ok) {
            const searchData = await searchResponse.json();

            // Find exact match in results
            const exactMatch = searchData.artists?.items?.find(
              a => normalize(a.name) === normalize(artistName)
            );

            if (exactMatch) {
              console.log(`   Found correct ID: ${exactMatch.id} for "${exactMatch.name}"`);

              // Update plays with correct ID
              const result = await plays.updateMany(
                { artistName: artistName, artistId: currentId },
                { $set: { artistId: exactMatch.id } }
              );

              console.log(`   ✅ Fixed ${result.modifiedCount} plays`);
              fixed += result.modifiedCount;
            } else {
              console.log(`   ⚠️  No exact match found in search results`);
              // Show search results
              if (searchData.artists?.items) {
                searchData.artists.items.slice(0, 3).forEach((a, i) => {
                  console.log(`      ${i + 1}. ${a.name} (${a.id})`);
                });
              }
              failed++;
            }
          }
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n📊 Verification Complete:`);
    console.log(`   ✅ Correct: ${correct}`);
    console.log(`   🔧 Fixed: ${fixed} plays`);
    console.log(`   ❌ Failed: ${failed}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

verifyAndFixArtistIds();
