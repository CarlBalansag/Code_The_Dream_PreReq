/**
 * Script to populate missing artistId fields in the plays collection
 *
 * Problem: 99.9% of plays have null artistId (imported data only has artistName)
 * Solution: Find unique artists without IDs, search Spotify for their IDs, then bulk update
 */

import { MongoClient } from 'mongodb';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'SpotifyLocal_Dev';

async function fixMissingArtistIds() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const plays = db.collection('plays');

    // Step 1: Find all unique artists with null artistId
    console.log('\n📊 Finding artists with missing IDs...');
    const artistsWithoutIds = await plays.aggregate([
      { $match: { artistId: null } },
      { $group: { _id: '$artistName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 100 } // Process top 100 artists first
    ]).toArray();

    console.log(`Found ${artistsWithoutIds.length} unique artists without IDs`);
    console.log(`Total plays affected: ${artistsWithoutIds.reduce((sum, a) => sum + a.count, 0)}`);

    // Step 2: Get access token from database (from a user)
    const users = db.collection('users');
    const user = await users.findOne({});

    if (!user) {
      console.error('❌ No user found in database');
      return;
    }

    // Check if token exists and is not expired
    let accessToken = user.spotifyAccessToken;

    if (!accessToken) {
      console.error('❌ No access token found for user');
      console.log('ℹ️  Please log in to the app to generate a fresh token, then run this script again');
      return;
    }

    // Check if token is expired
    if (user.tokenExpiresAt && new Date(user.tokenExpiresAt) < new Date()) {
      console.log('⚠️  Access token is expired, attempting to refresh...');

      if (!user.spotifyRefreshToken) {
        console.error('❌ No refresh token available');
        console.log('ℹ️  Please log in to the app to generate a fresh token, then run this script again');
        return;
      }

      // Refresh the token
      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: user.spotifyRefreshToken
        })
      });

      if (!tokenResponse.ok) {
        console.error('❌ Failed to refresh token');
        console.log('ℹ️  Please log in to the app to generate a fresh token, then run this script again');
        return;
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;

      // Update token in database
      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            spotifyAccessToken: accessToken,
            tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000)
          }
        }
      );

      console.log('✅ Access token refreshed successfully');
    }

    console.log(`\n🔑 Using access token from user: ${user.displayName}`);

    // Step 3: For each artist, search Spotify and update plays
    let updated = 0;
    let failed = 0;

    for (const [index, artist] of artistsWithoutIds.entries()) {
      const artistName = artist._id;
      const playCount = artist.count;

      try {
        console.log(`\n[${index + 1}/${artistsWithoutIds.length}] Processing: ${artistName} (${playCount} plays)`);

        // Search Spotify for artist
        const searchQuery = encodeURIComponent(artistName);
        const response = await fetch(
          `https://api.spotify.com/v1/search?q=${searchQuery}&type=artist&limit=1`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!response.ok) {
          console.error(`   ❌ Spotify API error: ${response.status}`);
          failed++;

          // Rate limit handling
          if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('Retry-After') || '5');
            console.log(`   ⏸️  Rate limited, waiting ${retryAfter}s...`);
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          }
          continue;
        }

        const data = await response.json();

        if (data.artists?.items?.[0]) {
          const spotifyArtist = data.artists.items[0];
          const artistId = spotifyArtist.id;

          // Update all plays for this artist
          const result = await plays.updateMany(
            { artistId: null, artistName: artistName },
            { $set: { artistId: artistId } }
          );

          console.log(`   ✅ Updated ${result.modifiedCount} plays with ID: ${artistId}`);
          updated += result.modifiedCount;
        } else {
          console.log(`   ⚠️  No Spotify match found`);
          failed++;
        }

        // Rate limiting: wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n📊 Final Stats:`);
    console.log(`   ✅ Updated: ${updated} plays`);
    console.log(`   ❌ Failed: ${failed} artists`);
    console.log(`   📈 Success rate: ${((artistsWithoutIds.length - failed) / artistsWithoutIds.length * 100).toFixed(1)}%`);

    // Verify
    const remainingNull = await plays.countDocuments({ artistId: null });
    const total = await plays.countDocuments({});
    console.log(`\n🔍 Verification:`);
    console.log(`   Total plays: ${total}`);
    console.log(`   Still with null artistId: ${remainingNull} (${(remainingNull/total*100).toFixed(1)}%)`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the script
fixMissingArtistIds();
