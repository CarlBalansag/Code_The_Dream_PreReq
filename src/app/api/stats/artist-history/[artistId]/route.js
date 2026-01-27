<<<<<<< HEAD
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
=======
import {
  getArtistDailyHistory,
  getArtistFirstPlayDate,
  getArtistListeningDuration,
} from '@/lib/db/play.js';
import prisma from '@/lib/prisma.js';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
    const { artistId } = params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const timeRange = searchParams.get('timeRange') || '30D';
<<<<<<< HEAD
    const artistNameParam = searchParams.get('artistName'); // Optional artist name for fallback

    // Validate required parameters
=======
    const artistNameParam = searchParams.get('artistName');

>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
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

<<<<<<< HEAD
    // Calculate date range
    // Set endDate to end of current day (23:59:59) to include all plays today
=======
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    let startDate = getStartDate(timeRange);
<<<<<<< HEAD

=======
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
    if (!startDate) {
      return NextResponse.json(
        { error: 'Invalid time range. Use: 7D, 30D, ALL' },
        { status: 400 }
      );
    }

<<<<<<< HEAD
    // First, try to find the artist name from the artistId
    // We need this early for the ALL time range query
    let artistNameFromDb = null;
    const artistPlay = await Play.findOne({ userId, artistId }).select('artistName');
    if (artistPlay) {
      artistNameFromDb = artistPlay.artistName;
    } else if (artistNameParam) {
      // Fallback: If artistId not found, use the name from the query parameter
      // This handles cases where imported data has null artistId
      artistNameFromDb = artistNameParam;
      console.log(`ℹ️  Artist ID not found in database, using artistName from parameter: ${artistNameParam}`);
    }

    // For 'ALL' time range, use the earliest play date for this artist
    // Match by artistId OR artistName (for plays without artistId)
    if (timeRange === 'ALL') {
      const query = {
        userId,
        $or: [
          { artistId: artistId },
          // Fallback: match by name if artistId is null
          artistNameFromDb ? { artistId: null, artistName: artistNameFromDb } : null
        ].filter(Boolean) // Remove null values
      };

      const earliestPlay = await Play.findOne(query)
        .sort({ playedAt: 1 })
        .select('playedAt');

      if (earliestPlay) {
        startDate = new Date(earliestPlay.playedAt);
        startDate.setHours(0, 0, 0, 0);
      } else {
        // If no plays found, return 404
        return NextResponse.json(
          {
            error: 'No listening history found for this artist',
            message: `You haven't listened to this artist.`
=======
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let artistName = await resolveArtistName(artistId, artistNameParam);

    if (timeRange === 'ALL') {
      const earliestPlay = await getArtistFirstPlayDate(userId, artistId, artistNameParam);
      if (!earliestPlay) {
        return NextResponse.json(
          {
            error: 'No listening history found for this artist',
            message: `You haven't listened to this artist.`,
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
          },
          { status: 404 }
        );
      }
<<<<<<< HEAD
    }

    console.log(`📊 Fetching artist history for ${artistId}`);
    console.log(`   User: ${userId}`);
    console.log(`   Artist Name: ${artistNameFromDb || 'Unknown'}`);
    console.log(`   Time Range: ${timeRange}`);
    console.log(`   Date Range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Build aggregation pipeline
    const matchStage = {
      userId,
      playedAt: { $gte: startDate, $lte: endDate }
    };

    // Get local timezone for proper day grouping
    // This ensures plays are grouped by YOUR local day, not UTC day
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log(`   Using timezone: ${localTimezone}`);

    // Aggregate plays by day
    // Match by artistId OR artistName (for plays without artistId)
    const dailyPlays = await Play.aggregate([
      // Filter by user and date range
      { $match: matchStage },

      // Group by day (using local timezone to avoid date shifts)
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$playedAt", timezone: localTimezone } }
          },
          totalSongs: { $sum: 1 },
          artistSongs: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$artistId", artistId] },
                    // Fallback: match by name if artistId is null
                    {
                      $and: [
                        { $eq: ["$artistId", null] },
                        artistNameFromDb ? { $eq: ["$artistName", artistNameFromDb] } : false
                      ]
                    }
                  ]
                },
                1,
                0
              ]
            }
          },
          // Get artist name from first matching play
          artistName: {
            $first: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$artistId", artistId] },
                    artistNameFromDb ? { $eq: ["$artistName", artistNameFromDb] } : false
                  ]
                },
                "$artistName",
                null
              ]
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
=======
      startDate = new Date(earliestPlay);
      startDate.setHours(0, 0, 0, 0);
    }

    console.log(`dY"S Fetching artist history for ${artistId}`);
    console.log(`   User: ${userId}`);
    console.log(`   Artist Name: ${artistName || artistNameParam || 'Unknown'}`);
    console.log(`   Time Range: ${timeRange}`);
    console.log(`   Date Range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    console.log(`   Using timezone: ${localTimezone}`);

    const dailyPlays = await getArtistDailyHistory({
      userId,
      artistId,
      artistName: artistNameParam,
      startDate,
      endDate,
      timezone: localTimezone,
    });

    if (!artistName) {
      artistName = artistNameParam || 'Unknown Artist';
    }

    // Get the user's favorite track from this artist in the time range
    console.log('📍 About to fetch favorite track with params:', { userId, artistId, artistName, startDate, endDate });
    const favoriteTrack = await getFavoriteTrackForArtist({
      userId,
      artistId,
      artistName: artistName,  // Use resolved artistName, not artistNameParam
      startDate,
      endDate,
    });
    console.log('📍 Favorite track result:', favoriteTrack);

    if (dailyPlays.length === 0 || !dailyPlays.some((day) => day.artistSongs > 0)) {
      return NextResponse.json(
        {
          error: 'No listening history found for this artist',
          message: `You haven't listened to ${artistName} in the selected time range.`,
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
        },
        { status: 404 }
      );
    }

<<<<<<< HEAD
    // For "ALL" time range, only show days where the artist was played (no empty days)
    // For other ranges (7D, 30D), fill in missing days to show gaps
    let chartData;
    if (timeRange === 'ALL') {
      // Filter to only days where artist was played
      const artistOnlyDays = dailyPlays.filter(day => day.artistSongs > 0);
      chartData = formatChartData(artistOnlyDays, timeRange);
      console.log(`✅ Found ${chartData.length} days where ${artistName} was played (All Time mode - no empty days)`);
    } else {
      // Fill in missing days with zeros for short time ranges
      const filledDailyPlays = fillMissingDays(dailyPlays, startDate, endDate, localTimezone);
      chartData = formatChartData(filledDailyPlays, timeRange);
      console.log(`✅ Found ${chartData.length} days of data (including ${chartData.length - dailyPlays.length} empty days)`);
    }

    console.log(`   Artist: ${artistName}`);
=======
    let chartData;
    if (timeRange === 'ALL') {
      const artistOnlyDays = dailyPlays.filter((day) => day.artistSongs > 0);
      chartData = formatChartData(artistOnlyDays, timeRange);
      console.log(`�o. Found ${chartData.length} days where ${artistName} was played (All Time mode - no empty days)`);
    } else {
      const filledDailyPlays = fillMissingDays(dailyPlays, startDate, endDate, localTimezone);
      chartData = formatChartData(filledDailyPlays, timeRange);
      console.log(`�o. Found ${chartData.length} days of data (including ${chartData.length - dailyPlays.length} empty days)`);
    }

    const totalListeningTimeMs = await getArtistListeningDuration(userId, {
      artistId,
      artistName: artistNameParam,
      startDate,
      endDate,
    });
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600

    return NextResponse.json({
      artistId,
      artistName,
      timeRange,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      chartData,
      totalDays: chartData.length,
      totalPlays: chartData.reduce((sum, day) => sum + day.artistSongs, 0),
<<<<<<< HEAD
    });

  } catch (error) {
    console.error('❌ Artist history API error:', error);
    return NextResponse.json(
      {
        error: error.message,
        message: 'Failed to fetch artist history'
=======
      totalListeningTimeMs,
      favoriteTrack: favoriteTrack || null,
    });
  } catch (error) {
    console.error('�?O Artist history API error:', error);
    return NextResponse.json(
      {
        error: error.message,
        message: 'Failed to fetch artist history',
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
      },
      { status: 500 }
    );
  }
}

<<<<<<< HEAD
/**
 * Calculate start date based on time range
 * Sets time to start of day (00:00:00) in local timezone
 */
=======
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
function getStartDate(timeRange) {
  const now = new Date();
  let startDate;

  switch (timeRange) {
    case '7D':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30D':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'ALL':
<<<<<<< HEAD
      // This is a placeholder - will be replaced with actual earliest play date
=======
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
      startDate = new Date('2000-01-01');
      break;
    default:
      return null;
  }

<<<<<<< HEAD
  // Set to start of day (00:00:00) to ensure we capture full days
=======
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
  startDate.setHours(0, 0, 0, 0);
  return startDate;
}

<<<<<<< HEAD
/**
 * Fill in missing days with zero plays
 * This ensures the chart shows continuous data without gaps
 */
function fillMissingDays(dailyPlays, startDate, endDate, timezone) {
  // Create a map of existing data by date
  const dataMap = new Map();
  dailyPlays.forEach(day => {
    dataMap.set(day.date, day);
  });

  // Generate all days in the range
=======
function fillMissingDays(dailyPlays, startDate, endDate, timezone) {
  const dataMap = new Map();
  dailyPlays.forEach((day) => {
    dataMap.set(day.date, day);
  });

>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
  const filledData = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
<<<<<<< HEAD
    // Format date as YYYY-MM-DD in the specified timezone
    const dateStr = formatDateString(currentDate, timezone);

    // Use existing data or create empty entry
=======
    const dateStr = formatDateString(currentDate, timezone);
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
    if (dataMap.has(dateStr)) {
      filledData.push(dataMap.get(dateStr));
    } else {
      filledData.push({
        date: dateStr,
        totalSongs: 0,
        artistSongs: 0,
<<<<<<< HEAD
        artistName: null
      });
    }

    // Move to next day
=======
      });
    }

>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return filledData;
}

<<<<<<< HEAD
/**
 * Format date as YYYY-MM-DD string in specified timezone
 */
function formatDateString(date, timezone) {
  // Get the date parts in the specified timezone
  const options = { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: timezone };
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date);

  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
=======
function formatDateString(date, timezone) {
  const options = { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: timezone };
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date);

  const year = parts.find((p) => p.type === 'year').value;
  const month = parts.find((p) => p.type === 'month').value;
  const day = parts.find((p) => p.type === 'day').value;
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600

  return `${year}-${month}-${day}`;
}

<<<<<<< HEAD
/**
 * Format chart data with proper date labels
 */
function formatChartData(dailyPlays, timeRange) {
  return dailyPlays.map(day => {
    const date = new Date(day.date + 'T00:00:00Z');
=======
function formatChartData(dailyPlays, timeRange) {
  return dailyPlays.map((day) => {
    const date = new Date(day.date + 'T00:00:00Z');
    const totalSongs = day.totalSongs || 0;
    const artistSongs = day.artistSongs || 0;
    const percentage =
      totalSongs > 0 ? Math.round((artistSongs / totalSongs) * 100) : 0;
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600

    return {
      date: formatShortDate(date, timeRange),
      fullDate: formatFullDate(date),
<<<<<<< HEAD
      totalSongs: day.totalSongs,
      artistSongs: day.artistSongs,
      percentage: Math.round((day.artistSongs / day.totalSongs) * 100)
=======
      totalSongs,
      artistSongs,
      percentage,
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
    };
  });
}

<<<<<<< HEAD
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
=======
function formatShortDate(date, timeRange) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (timeRange === '7D' || timeRange === '30D') {
    return `${months[date.getMonth()]} ${date.getDate()}`;
  }
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
function formatFullDate(date) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}
<<<<<<< HEAD
=======

async function resolveArtistName(artistId, fallbackName) {
  if (artistId) {
    const artist = await prisma.artists.findUnique({
      where: { id: artistId },
      select: { name: true },
    });
    if (artist?.name) {
      return artist.name;
    }
  }

  return fallbackName || null;
}

async function getFavoriteTrackForArtist({ userId, artistId, artistName, startDate, endDate }) {
  try {
    const { Prisma } = await import('@prisma/client');

    console.log('🎵 Fetching favorite track for:', { userId, artistId, artistName, startDate, endDate });

    const rows = await prisma.$queryRaw`
      SELECT
        t.id AS track_id,
        t.name AS track_name,
        COUNT(*)::bigint AS play_count
      FROM plays p
      INNER JOIN tracks t ON t.id = p.track_id
      INNER JOIN artists ar ON ar.id = t.artist_id
      WHERE
        p.user_id = ${userId}
        ${startDate ? Prisma.sql`AND p.played_at >= ${startDate}` : Prisma.empty}
        ${endDate ? Prisma.sql`AND p.played_at <= ${endDate}` : Prisma.empty}
        AND t.name IS NOT NULL
        AND (
          ${artistId ? Prisma.sql`t.artist_id = ${artistId}` : Prisma.sql`FALSE`}
          OR ${artistName ? Prisma.sql`LOWER(ar.name) = LOWER(${artistName})` : Prisma.sql`FALSE`}
        )
      GROUP BY t.id, t.name
      ORDER BY play_count DESC
      LIMIT 1;
    `;

    console.log('🎵 Favorite track query result:', rows);

    if (rows.length > 0) {
      const result = {
        trackId: rows[0].track_id,
        trackName: rows[0].track_name,
        playCount: Number(rows[0].play_count),
      };
      console.log('✅ Favorite track found:', result);
      return result;
    }

    console.log('⚠️ No favorite track found');
    return null;
  } catch (error) {
    console.error('❌ Error fetching favorite track:', error);
    return null;
  }
}
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
