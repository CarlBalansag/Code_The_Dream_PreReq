import {
  createJob,
  getActiveJob,
} from '@/lib/db/importJob.js';
import { processImport } from '@/lib/import/processImport.js';
import { NextResponse } from 'next/server';

// Route segment config for App Router
// Increase max duration for processing large files (Vercel Pro: up to 300s, Hobby: 60s)
export const maxDuration = 60;

// Note: For body size limits in App Router, Vercel has a hard limit of 4.5MB for serverless functions
// For larger files, users need to split their Spotify export files or use chunked uploads

/**
 * POST /api/import/spotify-history
 * Upload and start importing Spotify listening history from JSON file
 *
 * Body: FormData with 'file' and 'userId'
 */
export async function POST(req) {
  try {
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
    const existingJob = await getActiveJob(userId);
    if (existingJob) {
      return NextResponse.json(
        {
          error: 'Import already in progress',
          message: 'You already have an import in progress. Please wait for it to complete.',
          jobId: existingJob.id.toString()
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
    // Create import job and store payload for queued processing
    const jobFileName = files.length === 1 ? fileNames[0] : `${files.length} files`;
    const job = await createJob(userId, jobFileName, allSpotifyData.length, {
      rawData: allSpotifyData,
    });

    console.log(`📝 Created import job: ${job.id}`);

    // Process import directly (bypassing QStash for reliability)
    // This runs in the background - the response returns immediately
    processImport(job.id.toString(), userId, allSpotifyData).catch(err => {
      console.error('❌ Background import error:', err);
    });

    return NextResponse.json({
      success: true,
      jobId: job.id.toString(),
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
