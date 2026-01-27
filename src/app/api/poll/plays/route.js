<<<<<<< HEAD
import { connectToDB } from '@/lib/mongodb.js';
=======
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
import { pollRecentlyPlayed } from '@/lib/services/continuousPolling.js';
import { NextResponse } from 'next/server';

/**
 * POST /api/poll/plays
 * Poll Spotify for new plays for a specific user
 *
 * Body: { spotifyId: string }
 */
export async function POST(req) {
  try {
<<<<<<< HEAD
    // Connect to database
    await connectToDB();

=======
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
    // Parse request body
    const { spotifyId } = await req.json();

    if (!spotifyId) {
      return NextResponse.json(
        { error: 'spotifyId is required' },
        { status: 400 }
      );
    }

    // Poll for new plays
    const result = await pollRecentlyPlayed(spotifyId);

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Polling API error:', error.message);

    // Check if it's a Spotify API error
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication failed',
          message: 'Spotify token may have expired. Please log in again.',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: 'Failed to poll for new plays'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/poll/plays?spotifyId=xxx
 * Quick check for new plays (returns count only)
 */
export async function GET(req) {
  try {
<<<<<<< HEAD
    await connectToDB();

=======
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
    const { searchParams } = new URL(req.url);
    const spotifyId = searchParams.get('spotifyId');

    if (!spotifyId) {
      return NextResponse.json(
        { error: 'spotifyId is required' },
        { status: 400 }
      );
    }

    const result = await pollRecentlyPlayed(spotifyId);

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Polling check error:', error.message);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
