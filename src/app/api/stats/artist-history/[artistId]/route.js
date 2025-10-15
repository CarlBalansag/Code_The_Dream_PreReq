import { connectToDB } from '@/lib/mongodb.js';
import { Play } from '@/lib/models/Play.js';
import { NextResponse } from 'next/server';

/**
 * GET /api/stats/artist-history/[artistId]
 * Returns listening history chart data for a specific artist
 *
 * Query Parameters:
 * - userId: User's Spotify ID (required)
 * - timeRange: One of 7D, 30D, 3M, 6M, 1Y, ALL (default: 30D)
 *
 * Response:
 * {
 *   artistName: "Drake",
 *   artistId: "artist_id",
 *   timeRange: "30D",
 *   chartData: [
 *     { date: "Jan 1", fullDate: "January 1, 2025", totalSongs: 45, artistSongs: 20 },
 *     ...
 *   ]
 * }
 */
export async function GET(req, { params }) {
  try {
    await connectToDB();

    // Get parameters
    const { artistId } = params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const timeRange = searchParams.get('timeRange') || '30D';

    // Validate required parameters
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!artistId) {
      return NextResponse.json(
        { error: 'artistId is required' },
        { status: 400 }
      );
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = getStartDate(timeRange);

    if (!startDate) {
      return NextResponse.json(
        { error: 'Invalid time range. Use: 7D, 30D, 3M, 6M, 1Y, ALL' },
        { status: 400 }
      );
    }

    console.log(`📊 Fetching artist history for ${artistId}`);
    console.log(`   User: ${userId}`);
    console.log(`   Time Range: ${timeRange}`);
    console.log(`   Date Range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Build aggregation pipeline
    const matchStage = {
      userId,
      playedAt: { $gte: startDate, $lte: endDate }
    };

    // Aggregate plays by day
    const dailyPlays = await Play.aggregate([
      // Filter by user and date range
      { $match: matchStage },

      // Group by day
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$playedAt", timezone: "UTC" } }
          },
          totalSongs: { $sum: 1 },
          artistSongs: {
            $sum: {
              $cond: [{ $eq: ["$artistId", artistId] }, 1, 0]
            }
          },
          // Get artist name from first matching play
          artistName: {
            $first: {
              $cond: [{ $eq: ["$artistId", artistId] }, "$artistName", null]
            }
          }
        }
      },

      // Sort by date (oldest first)
      { $sort: { "_id.date": 1 } },

      // Project to clean format
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          totalSongs: 1,
          artistSongs: 1,
          artistName: 1
        }
      }
    ]);

    // Get artist name from first matching play if not in aggregation
    let artistName = null;
    if (dailyPlays.length > 0 && dailyPlays[0].artistName) {
      artistName = dailyPlays[0].artistName;
    } else {
      // Fallback: find any play by this artist
      const artistPlay = await Play.findOne({ userId, artistId }).select('artistName');
      artistName = artistPlay ? artistPlay.artistName : 'Unknown Artist';
    }

    // Check if user has listened to this artist
    if (dailyPlays.length === 0 || !dailyPlays.some(day => day.artistSongs > 0)) {
      return NextResponse.json(
        {
          error: 'No listening history found for this artist',
          message: `You haven't listened to ${artistName} in the selected time range.`
        },
        { status: 404 }
      );
    }

    // Format chart data
    const chartData = formatChartData(dailyPlays, timeRange);

    console.log(`✅ Found ${chartData.length} days of data`);
    console.log(`   Artist: ${artistName}`);

    return NextResponse.json({
      artistId,
      artistName,
      timeRange,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      chartData,
      totalDays: chartData.length,
      totalPlays: chartData.reduce((sum, day) => sum + day.artistSongs, 0),
    });

  } catch (error) {
    console.error('❌ Artist history API error:', error);
    return NextResponse.json(
      {
        error: error.message,
        message: 'Failed to fetch artist history'
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate start date based on time range
 */
function getStartDate(timeRange) {
  const now = new Date();

  switch (timeRange) {
    case '7D':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30D':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '3M':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '6M':
      return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    case '1Y':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    case 'ALL':
      return new Date('2000-01-01'); // Far enough back to get all data
    default:
      return null;
  }
}

/**
 * Format chart data with proper date labels
 */
function formatChartData(dailyPlays, timeRange) {
  return dailyPlays.map(day => {
    const date = new Date(day.date + 'T00:00:00Z');

    return {
      date: formatShortDate(date, timeRange),
      fullDate: formatFullDate(date),
      totalSongs: day.totalSongs,
      artistSongs: day.artistSongs,
      percentage: Math.round((day.artistSongs / day.totalSongs) * 100)
    };
  });
}

/**
 * Format date for chart x-axis
 */
function formatShortDate(date, timeRange) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // For 7D and 30D, show "Jan 1" format
  if (timeRange === '7D' || timeRange === '30D') {
    return `${months[date.getMonth()]} ${date.getDate()}`;
  }

  // For longer ranges, show "Jan 2025" format
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Format full date for tooltip
 */
function formatFullDate(date) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}
