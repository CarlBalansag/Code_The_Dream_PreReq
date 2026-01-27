import { getArtistPlayCount } from '@/lib/db/play.js';
import { NextResponse } from 'next/server';

function getTimeRangeBounds(range) {
  const now = new Date();
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  let startDate = null;

  switch (range) {
    case 'short_term': {
      startDate = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
      break;
    }
    case 'medium_term': {
      startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      break;
    }
    case 'long_term': {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    }
    case 'all_time':
    default:
      startDate = null;
  }

  if (startDate) {
    startDate.setHours(0, 0, 0, 0);
  }

  return {
    startDate,
    endDate: range === 'all_time' ? null : endDate,
  };
}

export async function POST(req) {
  try {
    const { userId, timeRange = 'short_term', artists } = await req.json();

    if (!userId || !Array.isArray(artists) || artists.length === 0) {
      return NextResponse.json(
        { error: 'userId and artists array are required' },
        { status: 400 }
      );
    }

    const clampedArtists = artists.slice(0, 50);
    const { startDate, endDate } = getTimeRangeBounds(timeRange);

    const counts = await Promise.all(
      clampedArtists.map(async (artist) => {
        const playCount = await getArtistPlayCount(userId, {
          artistId: artist.id || null,
          artistName: artist.name || null,
          startDate,
          endDate,
        });

        return {
          id: artist.id || null,
          name: artist.name || null,
          playCount,
        };
      })
    );

    return NextResponse.json({ counts });
  } catch (error) {
    console.error('artist-play-counts error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get artist play counts' },
      { status: 500 }
    );
  }
}
