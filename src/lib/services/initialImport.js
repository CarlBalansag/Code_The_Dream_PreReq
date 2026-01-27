<<<<<<< HEAD
import { trackMultiplePlays } from '../db/playOperations.js';
import { markInitialImportComplete, getUserBySpotifyId } from '../db/userOperations.js';
=======
import {
  getUserBySpotifyId,
  markInitialImportComplete,
  trackMultiplePlays,
} from '../db/index.js';
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
import { spotifyApiRequest } from '../utils/spotifyTokenRefresh.js';

/**
 * Initial Import Service
 * Fetches and stores user's recent 50 plays from Spotify when they first log in
 */

/**
 * Import user's recent 50 plays from Spotify
 * @param {string} spotifyId - User's Spotify ID
 * @returns {object} Import result with count of imported plays
 */
export async function importRecentPlays(spotifyId) {
  try {
    console.log(`🔄 Starting initial import for user: ${spotifyId}`);

    // Get user from database
    const user = await getUserBySpotifyId(spotifyId);
    if (!user) {
      throw new Error(`User not found: ${spotifyId}`);
    }

    // Check if initial import already done
    if (user.hasInitialImport) {
      console.log(`⚠️  Initial import already completed for: ${user.displayName}`);
      return {
        success: true,
        alreadyCompleted: true,
        message: 'Initial import already completed',
      };
    }

    // Fetch recently played tracks from Spotify (max 50)
    const url = 'https://api.spotify.com/v1/me/player/recently-played?limit=50';
    const data = await spotifyApiRequest(url, user);

    if (!data.items || data.items.length === 0) {
      console.log(`⚠️  No recently played tracks found for: ${user.displayName}`);

      // Mark as completed even if no plays found
      await markInitialImportComplete(spotifyId);

      return {
        success: true,
        imported: 0,
        message: 'No recently played tracks found',
      };
    }

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
      source: 'initial_import',
    }));

    // Bulk insert plays (duplicates automatically skipped)
    const result = await trackMultiplePlays(plays);

    // Mark initial import as complete
    await markInitialImportComplete(spotifyId);

    console.log(`✅ Initial import complete for ${user.displayName}`);
    console.log(`   Imported: ${result.inserted} plays`);
    if (result.duplicates) {
      console.log(`   Skipped: ${result.duplicates} duplicates`);
    }

    return {
      success: true,
      imported: result.inserted,
      duplicates: result.duplicates || 0,
      total: data.items.length,
      message: `Successfully imported ${result.inserted} plays`,
    };

  } catch (error) {
    console.error(`❌ Initial import failed for ${spotifyId}:`, error.message);
    throw error;
  }
}

/**
 * Check if user needs initial import
 * @param {string} spotifyId - User's Spotify ID
 * @returns {boolean} True if initial import needed
 */
export async function needsInitialImport(spotifyId) {
  const user = await getUserBySpotifyId(spotifyId);
  if (!user) return false;
  return !user.hasInitialImport;
}
