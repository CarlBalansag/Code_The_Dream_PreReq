<<<<<<< HEAD
import { trackMultiplePlays } from '../db/playOperations.js';
import { updateLastCheckTimestamp, getUserBySpotifyId } from '../db/userOperations.js';
=======
import {
  getUserBySpotifyId,
  trackMultiplePlays,
  updateLastCheckTimestamp,
} from '../db/index.js';
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
import { spotifyApiRequest } from '../utils/spotifyTokenRefresh.js';

/**
 * Continuous Polling Service
 * Polls Spotify's "recently played" endpoint to detect and track new plays
 */

/**
 * Poll Spotify for new plays since last check
 * @param {string} spotifyId - User's Spotify ID
 * @param {object} options - Polling options
 * @returns {object} Result with count of new plays found
 */
export async function pollRecentlyPlayed(spotifyId, options = {}) {
  const { limit = 50 } = options;

  try {
    console.log(`🔄 Polling recently played for user: ${spotifyId}`);

    // Get user from database
    const user = await getUserBySpotifyId(spotifyId);
    if (!user) {
      throw new Error(`User not found: ${spotifyId}`);
    }

    // Build Spotify API URL
    let url = `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`;

    // If we have a last check timestamp, only get plays after that time
    if (user.lastCheckTimestamp) {
      // Convert to Unix timestamp in milliseconds
      const afterTimestamp = user.lastCheckTimestamp.getTime();
      url += `&after=${afterTimestamp}`;
      console.log(`   Checking for plays after: ${user.lastCheckTimestamp.toISOString()}`);
    }

    // Fetch recently played tracks from Spotify
    const data = await spotifyApiRequest(url, user);

    if (!data.items || data.items.length === 0) {
      console.log(`   No new plays found for: ${user.displayName}`);

      // Update last check timestamp even if no new plays
      await updateLastCheckTimestamp(spotifyId);

      return {
        success: true,
        newPlays: 0,
        message: 'No new plays found',
      };
    }

    console.log(`   Found ${data.items.length} recent plays`);

    // Format plays for database
    const plays = data.items.map(item => ({
      userId: spotifyId,
      trackId: item.track.id,
      trackName: item.track.name,
      artistId: item.track.artists[0]?.id || 'unknown',
      artistName: item.track.artists[0]?.name || 'Unknown Artist',
      albumId: item.track.album.id,
      albumName: item.track.album.name,
      albumImage: item.track.album.images[0]?.url || null,
      playedAt: item.played_at,
      durationMs: item.track.duration_ms,
      source: 'tracked',
    }));

    // Bulk insert plays (duplicates automatically skipped)
    const result = await trackMultiplePlays(plays);

    // Update last check timestamp
    await updateLastCheckTimestamp(spotifyId);

    console.log(`✅ Polling complete for ${user.displayName}`);
    console.log(`   New plays: ${result.inserted}`);
    if (result.duplicates) {
      console.log(`   Duplicates skipped: ${result.duplicates}`);
    }

    return {
      success: true,
      newPlays: result.inserted,
      duplicates: result.duplicates || 0,
      total: data.items.length,
      message: `Found ${result.inserted} new plays`,
    };

  } catch (error) {
    console.error(`❌ Polling failed for ${spotifyId}:`, error.message);
    throw error;
  }
}

/**
 * Poll for multiple users (useful for background jobs)
 * @param {Array<string>} spotifyIds - Array of user Spotify IDs
 * @returns {object} Aggregated results
 */
export async function pollMultipleUsers(spotifyIds) {
  const results = {
    success: [],
    failed: [],
    totalNewPlays: 0,
  };

  console.log(`🔄 Starting batch poll for ${spotifyIds.length} users`);

  for (const spotifyId of spotifyIds) {
    try {
      const result = await pollRecentlyPlayed(spotifyId);
      results.success.push({
        spotifyId,
        newPlays: result.newPlays,
      });
      results.totalNewPlays += result.newPlays;
    } catch (error) {
      results.failed.push({
        spotifyId,
        error: error.message,
      });
    }
  }

  console.log(`✅ Batch poll complete`);
  console.log(`   Success: ${results.success.length}`);
  console.log(`   Failed: ${results.failed.length}`);
  console.log(`   Total new plays: ${results.totalNewPlays}`);

  return results;
}

/**
 * Get recommended polling interval based on user activity
 * @param {object} user - User object from database
 * @returns {number} Recommended interval in milliseconds
 */
export function getRecommendedPollingInterval(user) {
  // If user has never been checked, poll soon (1 minute)
  if (!user.lastCheckTimestamp) {
    return 60 * 1000;
  }

  // Calculate time since last check
  const timeSinceLastCheck = Date.now() - user.lastCheckTimestamp.getTime();

  // If last check was recent (< 5 minutes), wait longer (5 minutes)
  if (timeSinceLastCheck < 5 * 60 * 1000) {
    return 5 * 60 * 1000;
  }

  // Default: poll every 3 minutes
  return 3 * 60 * 1000;
}
