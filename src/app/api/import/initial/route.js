import { connectToDB } from '@/lib/mongodb.js';
import { importRecentPlays, needsInitialImport } from '@/lib/services/initialImport.js';
import { NextResponse } from 'next/server';

/**
 * POST /api/import/initial
 * Imports user's recent 50 plays from Spotify
 *
 * Body: { spotifyId: string }
 */
export async function POST(req) {
  try {
    // Connect to database
    await connectToDB();

    // Parse request body
    const { spotifyId } = await req.json();

    if (!spotifyId) {
      return NextResponse.json(
        { error: 'spotifyId is required' },
        { status: 400 }
      );
    }

    // Check if import is needed
    const importNeeded = await needsInitialImport(spotifyId);

    if (!importNeeded) {
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        message: 'Initial import already completed',
      });
    }

    // Perform initial import
    const result = await importRecentPlays(spotifyId);

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Initial import API error:', error.message);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: 'Failed to import recent plays'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/import/initial?spotifyId=xxx
 * Check if user needs initial import
 */
export async function GET(req) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const spotifyId = searchParams.get('spotifyId');

    if (!spotifyId) {
      return NextResponse.json(
        { error: 'spotifyId is required' },
        { status: 400 }
      );
    }

    const importNeeded = await needsInitialImport(spotifyId);

    return NextResponse.json({
      spotifyId,
      needsInitialImport: importNeeded,
    });

  } catch (error) {
    console.error('❌ Check import status error:', error.message);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
