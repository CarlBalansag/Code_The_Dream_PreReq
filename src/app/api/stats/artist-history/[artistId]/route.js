import { getArtistDailyHistory, getArtistFirstPlayDate } from '@/lib/db/play.js';
import prisma from '@/lib/prisma.js';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    const { artistId } = params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const timeRange = searchParams.get('timeRange') || '30D';
    const artistNameParam = searchParams.get('artistName');

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

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    let startDate = getStartDate(timeRange);
    if (!startDate) {
      return NextResponse.json(
        { error: 'Invalid time range. Use: 7D, 30D, ALL' },
        { status: 400 }
      );
    }

    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let artistName = await resolveArtistName(artistId, artistNameParam);

    if (timeRange === 'ALL') {
      const earliestPlay = await getArtistFirstPlayDate(userId, artistId, artistNameParam);
      if (!earliestPlay) {
        return NextResponse.json(
          {
            error: 'No listening history found for this artist',
            message: `You haven't listened to this artist.`,
          },
          { status: 404 }
        );
      }
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
        },
        { status: 404 }
      );
    }

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

    return NextResponse.json({
      artistId,
      artistName,
      timeRange,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      chartData,
      totalDays: chartData.length,
      totalPlays: chartData.reduce((sum, day) => sum + day.artistSongs, 0),
      favoriteTrack: favoriteTrack || null,
    });
  } catch (error) {
    console.error('�?O Artist history API error:', error);
    return NextResponse.json(
      {
        error: error.message,
        message: 'Failed to fetch artist history',
      },
      { status: 500 }
    );
  }
}

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
      startDate = new Date('2000-01-01');
      break;
    default:
      return null;
  }

  startDate.setHours(0, 0, 0, 0);
  return startDate;
}

function fillMissingDays(dailyPlays, startDate, endDate, timezone) {
  const dataMap = new Map();
  dailyPlays.forEach((day) => {
    dataMap.set(day.date, day);
  });

  const filledData = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateStr = formatDateString(currentDate, timezone);
    if (dataMap.has(dateStr)) {
      filledData.push(dataMap.get(dateStr));
    } else {
      filledData.push({
        date: dateStr,
        totalSongs: 0,
        artistSongs: 0,
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return filledData;
}

function formatDateString(date, timezone) {
  const options = { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: timezone };
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date);

  const year = parts.find((p) => p.type === 'year').value;
  const month = parts.find((p) => p.type === 'month').value;
  const day = parts.find((p) => p.type === 'day').value;

  return `${year}-${month}-${day}`;
}

function formatChartData(dailyPlays, timeRange) {
  return dailyPlays.map((day) => {
    const date = new Date(day.date + 'T00:00:00Z');
    const totalSongs = day.totalSongs || 0;
    const artistSongs = day.artistSongs || 0;
    const percentage =
      totalSongs > 0 ? Math.round((artistSongs / totalSongs) * 100) : 0;

    return {
      date: formatShortDate(date, timeRange),
      fullDate: formatFullDate(date),
      totalSongs,
      artistSongs,
      percentage,
    };
  });
}

function formatShortDate(date, timeRange) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (timeRange === '7D' || timeRange === '30D') {
    return `${months[date.getMonth()]} ${date.getDate()}`;
  }
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatFullDate(date) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

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
