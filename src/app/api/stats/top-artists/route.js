import { connectToDB } from '@/lib/mongodb.js';
import { Play } from '@/lib/models/Play.js';
import { NextResponse } from 'next/server';

/**
 * GET /api/stats/top-artists
 * Returns top artists with play counts from the database
 *
 * Query Parameters:
 * - userId: User's Spotify ID (required)
 * - timeRange: One of short_term, medium_term, long_term (optional, maps to date ranges)
 * - limit: Number of results (default 50)
 *
 * Response:
 * {
 *   artists: [
 *     { artistId: "id", artistName: "name", playCount: 1234 },
 *     ...
 *   ]
 * }
 */
export async function GET(req) {
  try {
    await connectToDB();

    // Get parameters
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const timeRange = searchParams.get('timeRange') || 'short_term';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Validate required parameters
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Map Spotify time ranges to date ranges
    let startDate = null;
    const endDate = new Date();

    switch (timeRange) {
      case 'short_term': // ~4 weeks
        startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
        break;
      case 'medium_term': // ~6 months
        startDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
        break;
      case 'long_term': // ~12 months
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'all_time': // All time - no start date filter
        startDate = null;
        break;
      default:
        startDate = null;
    }

    console.log(`📊 Fetching top artists for user: ${userId}`);
    console.log(`   Time Range: ${timeRange}`);
    if (startDate) {
      console.log(`   Date Range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    }

    // Fetch top artists using the Play model method
    const artists = await Play.getTopArtists(userId, {
      startDate,
      endDate,
      limit
    });

    console.log(`✅ Found ${artists.length} top artists`);

    return NextResponse.json({
      artists,
      timeRange,
      totalCount: artists.length
    });

  } catch (error) {
    console.error('❌ Top artists API error:', error);
    return NextResponse.json(
      {
        error: error.message,
        message: 'Failed to fetch top artists'
      },
      { status: 500 }
    );
  }
}
