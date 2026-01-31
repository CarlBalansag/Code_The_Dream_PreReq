import {
  completeJob,
  failJob,
  getJobById,
  markJobStarted,
  updateJobProgress,
} from '@/lib/db/importJob.js';
import { trackMultiplePlays } from '@/lib/db/play.js';

/**
 * Background processing function
 * Processes the import in batches
 */
export async function processImport(jobId, userId, spotifyData) {
  try {
    const job = await getJobById(jobId);
    if (!job) {
      throw new Error('Import job not found');
    }

    await markJobStarted(jobId);
    console.log(`🔄 Starting import processing for job ${jobId}`);

    const plays = [];
    const errors = [];

    for (let i = 0; i < spotifyData.length; i++) {
      const entry = spotifyData[i];

      try {
        let playedAt;
        let trackName;
        let artistName;
        let artistId = null;
        let albumName = null;
        let durationMs;
        let trackId = null;

        if (entry.endTime) {
          playedAt = parseSpotifyDate(entry.endTime);
          trackName = entry.trackName;
          artistName = entry.artistName;
          durationMs = parseInt(entry.msPlayed, 10) || 0;
        } else if (entry.ts) {
          playedAt = new Date(entry.ts);
          trackName = entry.master_metadata_track_name;
          artistName = entry.master_metadata_album_artist_name;
          albumName = entry.master_metadata_album_album_name || null;
          durationMs = parseInt(entry.ms_played, 10) || 0;

          if (entry.spotify_track_uri?.startsWith('spotify:track:')) {
            trackId = entry.spotify_track_uri.replace('spotify:track:', '');
          }

          if (entry.spotify_artist_uri?.startsWith('spotify:artist:')) {
            artistId = entry.spotify_artist_uri.replace('spotify:artist:', '');
          }
        } else {
          errors.push(`Row ${i + 1}: Unknown format`);
          continue;
        }

        if (!playedAt || Number.isNaN(playedAt.getTime())) {
          errors.push(`Row ${i + 1}: Invalid date format`);
          continue;
        }

        if (!trackName || !artistName) {
          continue;
        }

        plays.push({
          userId,
          trackId,
          trackName,
          artistId,
          artistName,
          albumName,
          playedAt,
          durationMs,
          source: 'full_import',
        });
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    if (!plays.length) {
      throw new Error('No valid plays to import');
    }

    console.log(`✅ Transformed ${plays.length} plays (${errors.length} errors)`);

    const BATCH_SIZE = 1000;
    let processedCount = 0;
    let insertedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < plays.length; i += BATCH_SIZE) {
      const batch = plays.slice(i, i + BATCH_SIZE);
      const result = await trackMultiplePlays(batch);

      insertedCount += result.inserted;
      skippedCount += batch.length - result.inserted;
      processedCount += batch.length;

      await updateJobProgress(jobId, processedCount);

      console.log(
        `📊 Progress: ${processedCount} / ${plays.length} (${Math.round(
          (processedCount / plays.length) * 100
        )}%)`
      );
    }

    await completeJob(jobId);

    console.log(`✅ Import complete!`);
    console.log(`   Total: ${plays.length}`);
    console.log(`   Inserted: ${insertedCount}`);
    console.log(`   Skipped (duplicates): ${skippedCount}`);
    console.log(`   Errors: ${errors.length}`);
  } catch (error) {
    console.error('❌ Import processing error:', error);

    if (jobId) {
      await failJob(jobId, error.message);
    }

    throw error;
  }
}

/**
 * Parse Spotify date format to JavaScript Date
 * Format: "2023-01-15 14:23" (YYYY-MM-DD HH:mm)
 */
function parseSpotifyDate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  // Split into date and time parts
  const parts = dateString.trim().split(' ');
  if (parts.length !== 2) {
    return null;
  }

  const [datePart, timePart] = parts;

  // Parse date: "2023-01-15"
  const [year, month, day] = datePart.split('-');

  // Parse time: "14:23"
  const [hour, minute] = timePart.split(':');

  // Create Date object (treating as UTC)
  const date = new Date(Date.UTC(
    parseInt(year),
    parseInt(month) - 1, // Month is 0-indexed
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    0
  ));

  return isNaN(date.getTime()) ? null : date;
}
