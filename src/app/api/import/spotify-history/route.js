import { connectToDB } from '@/lib/mongodb.js';
import { ImportJob } from '@/lib/models/ImportJob.js';
import { Play } from '@/lib/models/Play.js';
import { NextResponse } from 'next/server';

/**
 * POST /api/import/spotify-history
 * Upload and start importing Spotify listening history from JSON file
 *
 * Body: FormData with 'file' and 'userId'
 */
export async function POST(req) {
  try {
    await connectToDB();

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file');
    const userId = formData.get('userId');

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.json')) {
      return NextResponse.json(
        { error: 'File must be a JSON file' },
        { status: 400 }
      );
    }

    // Check if user already has an active import job
    const existingJob = await ImportJob.getActiveJob(userId);
    if (existingJob) {
      return NextResponse.json(
        {
          error: 'Import already in progress',
          message: 'You already have an import in progress. Please wait for it to complete.',
          jobId: existingJob._id.toString()
        },
        { status: 409 }
      );
    }

    console.log(`📥 Importing ${file.name} for user ${userId}`);
    console.log(`   File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

    // Read and parse JSON file
    const fileText = await file.text();
    let spotifyData;

    try {
      spotifyData = JSON.parse(fileText);
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid JSON file format' },
        { status: 400 }
      );
    }

    // Validate data structure
    if (!Array.isArray(spotifyData)) {
      return NextResponse.json(
        { error: 'JSON file must contain an array of play records' },
        { status: 400 }
      );
    }

    if (spotifyData.length === 0) {
      return NextResponse.json(
        { error: 'JSON file is empty' },
        { status: 400 }
      );
    }

    // Validate first entry has required fields
    const firstEntry = spotifyData[0];
    if (!firstEntry.endTime || !firstEntry.artistName || !firstEntry.trackName || !firstEntry.msPlayed) {
      return NextResponse.json(
        {
          error: 'Invalid data format',
          message: 'Each entry must have: endTime, artistName, trackName, msPlayed'
        },
        { status: 400 }
      );
    }

    console.log(`✅ Valid JSON with ${spotifyData.length} entries`);

    // Create import job
    const job = await ImportJob.createJob(userId, file.name, spotifyData.length);

    console.log(`📝 Created import job: ${job._id}`);

    // Start background processing (don't await)
    processImport(job._id.toString(), userId, spotifyData).catch(err => {
      console.error('❌ Background import error:', err);
    });

    return NextResponse.json({
      success: true,
      jobId: job._id.toString(),
      message: 'Import started',
      totalTracks: spotifyData.length
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
  let job;

  try {
    await connectToDB();

    // Get job and mark as processing
    job = await ImportJob.getJobById(jobId);
    if (!job) {
      throw new Error('Import job not found');
    }

    await job.start();
    console.log(`🔄 Starting import processing for job ${jobId}`);

    // Transform and validate data
    const plays = [];
    const errors = [];

    for (let i = 0; i < spotifyData.length; i++) {
      const entry = spotifyData[i];

      try {
        // Parse date from Spotify format: "2023-01-15 14:23"
        const playedAt = parseSpotifyDate(entry.endTime);

        if (!playedAt) {
          errors.push(`Row ${i + 1}: Invalid date format`);
          continue;
        }

        // Create play document
        const play = {
          userId: userId,
          trackId: null,  // Spotify export doesn't include IDs
          trackName: entry.trackName || 'Unknown Track',
          artistId: null,
          artistName: entry.artistName || 'Unknown Artist',
          albumId: null,
          albumName: null,
          playedAt: playedAt,
          durationMs: parseInt(entry.msPlayed) || 0,
          source: 'full_import'
        };

        plays.push(play);
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    if (plays.length === 0) {
      throw new Error('No valid plays to import');
    }

    console.log(`✅ Transformed ${plays.length} plays (${errors.length} errors)`);

    // Process in batches of 1000
    const BATCH_SIZE = 1000;
    let processedCount = 0;
    let insertedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < plays.length; i += BATCH_SIZE) {
      const batch = plays.slice(i, i + BATCH_SIZE);

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
    console.log(`   Total: ${plays.length}`);
    console.log(`   Inserted: ${insertedCount}`);
    console.log(`   Skipped (duplicates): ${skippedCount}`);
    console.log(`   Errors: ${errors.length}`);

  } catch (error) {
    console.error('❌ Import processing error:', error);

    if (job) {
      await job.fail(error.message);
    }
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
