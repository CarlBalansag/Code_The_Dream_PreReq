<<<<<<< HEAD
import { connectToDB } from '@/lib/mongodb.js';
import { ImportJob } from '@/lib/models/ImportJob.js';
import { Play } from '@/lib/models/Play.js';
=======
import {
  completeJob,
  createJob,
  failJob,
  getActiveJob,
  getJobById,
  markJobStarted,
  updateJobProgress,
} from '@/lib/db/importJob.js';
import { trackMultiplePlays } from '@/lib/db/play.js';
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
import { NextResponse } from 'next/server';

/**
 * POST /api/import/spotify-history
 * Upload and start importing Spotify listening history from JSON file
 *
 * Body: FormData with 'file' and 'userId'
 */
export async function POST(req) {
  try {
<<<<<<< HEAD
    await connectToDB();

=======
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
    // Parse form data
    const formData = await req.formData();
    const files = formData.getAll('files');
    const userId = formData.get('userId');

    // Validate inputs
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files uploaded' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Check if user already has an active import job
<<<<<<< HEAD
    const existingJob = await ImportJob.getActiveJob(userId);
=======
    const existingJob = await getActiveJob(userId);
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
    if (existingJob) {
      return NextResponse.json(
        {
          error: 'Import already in progress',
          message: 'You already have an import in progress. Please wait for it to complete.',
<<<<<<< HEAD
          jobId: existingJob._id.toString()
=======
          jobId: existingJob.id.toString()
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
        },
        { status: 409 }
      );
    }

    console.log(`📥 Importing ${files.length} file(s) for user ${userId}`);

    // Process all files and combine data
    const allSpotifyData = [];
    const fileNames = [];

    for (const file of files) {
      // Validate file type
      if (!file.name.endsWith('.json')) {
        return NextResponse.json(
          { error: `File ${file.name} must be a JSON file` },
          { status: 400 }
        );
      }

      console.log(`   Processing ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      fileNames.push(file.name);

      // Read and parse JSON file
      const fileText = await file.text();
      let spotifyData;

      try {
        spotifyData = JSON.parse(fileText);
      } catch (err) {
        return NextResponse.json(
          { error: `Invalid JSON format in ${file.name}` },
          { status: 400 }
        );
      }

      // Validate data structure
      if (!Array.isArray(spotifyData)) {
        return NextResponse.json(
          { error: `${file.name} must contain an array of play records` },
          { status: 400 }
        );
      }

      if (spotifyData.length === 0) {
        console.log(`⚠️  ${file.name} is empty, skipping`);
        continue;
      }

      // Validate first entry has required fields
      const firstEntry = spotifyData[0];

      // Spotify has different formats:
      // Format 1 (older): endTime, artistName, trackName, msPlayed
      // Format 2 (newer): ts, master_metadata_album_artist_name, master_metadata_track_name, ms_played
      const hasOldFormat = firstEntry.endTime && firstEntry.artistName && firstEntry.trackName && firstEntry.msPlayed !== undefined;
      const hasNewFormat = firstEntry.ts && firstEntry.master_metadata_track_name && firstEntry.ms_played !== undefined;

      if (!hasOldFormat && !hasNewFormat) {
        console.log(`❌ ${file.name} first entry:`, JSON.stringify(firstEntry, null, 2));
        return NextResponse.json(
          {
            error: `Invalid data format in ${file.name}`,
            message: 'File does not match expected Spotify export format. Please ensure you are uploading a Spotify listening history JSON file.'
          },
          { status: 400 }
        );
      }

      console.log(`   ✅ ${file.name}: ${spotifyData.length} entries`);
      allSpotifyData.push(...spotifyData);
    }

    if (allSpotifyData.length === 0) {
      return NextResponse.json(
        { error: 'No valid data found in any files' },
        { status: 400 }
      );
    }

    console.log(`✅ Combined ${allSpotifyData.length} total entries from ${files.length} file(s)`);

    // Create import job
    const jobFileName = files.length === 1 ? fileNames[0] : `${files.length} files`;
<<<<<<< HEAD
    const job = await ImportJob.createJob(userId, jobFileName, allSpotifyData.length);

    console.log(`📝 Created import job: ${job._id}`);

    // Start background processing (don't await)
    processImport(job._id.toString(), userId, allSpotifyData).catch(err => {
=======
    const job = await createJob(userId, jobFileName, allSpotifyData.length);

    console.log(`📝 Created import job: ${job.id}`);

    // Start background processing (don't await)
    processImport(job.id.toString(), userId, allSpotifyData).catch(err => {
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
      console.error('❌ Background import error:', err);
    });

    return NextResponse.json({
      success: true,
<<<<<<< HEAD
      jobId: job._id.toString(),
=======
      jobId: job.id.toString(),
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
      message: 'Import started',
      totalTracks: allSpotifyData.length,
      filesProcessed: files.length
    });

  } catch (error) {
    console.error('❌ Import upload error:', error);
    return NextResponse.json(
      {
        error: error.message,
        message: 'Failed to start import'
      },
      { status: 500 }
    );
  }
}

/**
 * Background processing function
 * Processes the import in batches
 */
async function processImport(jobId, userId, spotifyData) {
<<<<<<< HEAD
  let job;

  try {
    await connectToDB();

    // Get job and mark as processing
    job = await ImportJob.getJobById(jobId);
=======
  try {
    const job = await getJobById(jobId);
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
    if (!job) {
      throw new Error('Import job not found');
    }

<<<<<<< HEAD
    await job.start();
    console.log(`🔄 Starting import processing for job ${jobId}`);

    // Transform and validate data
=======
    await markJobStarted(jobId);
    console.log(`dY", Starting import processing for job ${jobId}`);

>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
    const plays = [];
    const errors = [];

    for (let i = 0; i < spotifyData.length; i++) {
      const entry = spotifyData[i];

      try {
<<<<<<< HEAD
        let playedAt, trackName, artistName, artistId, albumName, durationMs, trackId;

        // Handle different Spotify export formats
        if (entry.endTime) {
          // Old format: endTime, artistName, trackName, msPlayed
          playedAt = parseSpotifyDate(entry.endTime);
          trackName = entry.trackName;
          artistName = entry.artistName;
          artistId = null;
          albumName = null;
          durationMs = parseInt(entry.msPlayed) || 0;
          trackId = null;
        } else if (entry.ts) {
          // New format: ts, master_metadata_track_name, master_metadata_album_artist_name, ms_played
=======
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
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
          playedAt = new Date(entry.ts);
          trackName = entry.master_metadata_track_name;
          artistName = entry.master_metadata_album_artist_name;
          albumName = entry.master_metadata_album_album_name || null;
<<<<<<< HEAD
          durationMs = parseInt(entry.ms_played) || 0;

          // Extract track ID from spotify_track_uri (format: "spotify:track:45ttRl8uNtJkop7r9dmP4e")
          if (entry.spotify_track_uri && entry.spotify_track_uri.startsWith('spotify:track:')) {
            trackId = entry.spotify_track_uri.replace('spotify:track:', '');
          } else {
            trackId = null;
          }

          // Extract artist ID from spotify_artist_uri (format: "spotify:artist:2YZyLoL8N0Wb9xBt1NhZWg")
          if (entry.spotify_artist_uri && entry.spotify_artist_uri.startsWith('spotify:artist:')) {
            artistId = entry.spotify_artist_uri.replace('spotify:artist:', '');
          } else {
            artistId = null;
=======
          durationMs = parseInt(entry.ms_played, 10) || 0;

          if (entry.spotify_track_uri?.startsWith('spotify:track:')) {
            trackId = entry.spotify_track_uri.replace('spotify:track:', '');
          }

          if (entry.spotify_artist_uri?.startsWith('spotify:artist:')) {
            artistId = entry.spotify_artist_uri.replace('spotify:artist:', '');
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
          }
        } else {
          errors.push(`Row ${i + 1}: Unknown format`);
          continue;
        }

<<<<<<< HEAD
        if (!playedAt || isNaN(playedAt.getTime())) {
=======
        if (!playedAt || Number.isNaN(playedAt.getTime())) {
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
          errors.push(`Row ${i + 1}: Invalid date format`);
          continue;
        }

<<<<<<< HEAD
        // Skip entries with no track name or artist name (some entries might be null)
        if (!trackName || !artistName) {
          continue; // Silently skip - likely podcast/audiobook entries
        }

        // Create play document
        const play = {
          userId: userId,
          trackId: trackId,
          trackName: trackName,
          artistId: null,
          artistName: artistName,
          albumId: null,
          albumName: albumName,
          playedAt: playedAt,
          durationMs: durationMs,
          source: 'full_import'
        };

        plays.push(play);
=======
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
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

<<<<<<< HEAD
    if (plays.length === 0) {
      throw new Error('No valid plays to import');
    }

    console.log(`✅ Transformed ${plays.length} plays (${errors.length} errors)`);

    // Process in batches of 1000
=======
    if (!plays.length) {
      throw new Error('No valid plays to import');
    }

    console.log(`?o. Transformed ${plays.length} plays (${errors.length} errors)`);

>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
    const BATCH_SIZE = 1000;
    let processedCount = 0;
    let insertedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < plays.length; i += BATCH_SIZE) {
      const batch = plays.slice(i, i + BATCH_SIZE);
<<<<<<< HEAD

      try {
        // Insert batch with ordered: false to skip duplicates
        const result = await Play.insertMany(batch, {
          ordered: false,
          writeConcern: { w: 1 }
        });

        insertedCount += result.length;
        processedCount += batch.length;

      } catch (err) {
        // Handle duplicate key errors
        if (err.code === 11000) {
          // Some duplicates, count what was inserted
          const inserted = err.insertedDocs ? err.insertedDocs.length : 0;
          insertedCount += inserted;
          skippedCount += (batch.length - inserted);
          processedCount += batch.length;

          console.log(`⚠️ Batch ${Math.floor(i / BATCH_SIZE) + 1}: Inserted ${inserted}, skipped ${batch.length - inserted} duplicates`);
        } else {
          throw err;
        }
      }

      // Update progress
      await job.updateProgress(processedCount);

      console.log(`📊 Progress: ${processedCount} / ${plays.length} (${Math.round((processedCount / plays.length) * 100)}%)`);
    }

    // Mark as complete
    await job.complete();

    console.log(`✅ Import complete!`);
=======
      const result = await trackMultiplePlays(batch);

      insertedCount += result.inserted;
      skippedCount += batch.length - result.inserted;
      processedCount += batch.length;

      await updateJobProgress(jobId, processedCount);

      console.log(
        `dY"S Progress: ${processedCount} / ${plays.length} (${Math.round(
          (processedCount / plays.length) * 100
        )}%)`
      );
    }

    await completeJob(jobId);

    console.log(`?o. Import complete!`);
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
    console.log(`   Total: ${plays.length}`);
    console.log(`   Inserted: ${insertedCount}`);
    console.log(`   Skipped (duplicates): ${skippedCount}`);
    console.log(`   Errors: ${errors.length}`);
<<<<<<< HEAD

  } catch (error) {
    console.error('❌ Import processing error:', error);

    if (job) {
      await job.fail(error.message);
=======
  } catch (error) {
    console.error('??O Import processing error:', error);

    if (jobId) {
      await failJob(jobId, error.message);
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
    }
  }
}

<<<<<<< HEAD
=======

>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
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
