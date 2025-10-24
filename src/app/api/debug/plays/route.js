import { connectToDB } from '@/lib/mongodb.js';
import { Play } from '@/lib/models/Play.js';
import { NextResponse } from 'next/server';

/**
 * DEBUG ENDPOINT
 * GET /api/debug/plays?userId=<spotify_id>&limit=20
 *
 * Shows recent plays with full timestamp info to debug timezone issues
 */
export async function GET(req) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get recent plays
    const plays = await Play.find({ userId })
      .sort({ playedAt: -1 })
      .limit(limit)
      .lean();

    // Format for debugging
    const debugInfo = {
      userId,
      totalPlays: await Play.countDocuments({ userId }),
      serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      serverTime: new Date().toISOString(),
      recentPlays: plays.map(play => ({
        trackName: play.trackName,
        artistName: play.artistName,
        playedAt: play.playedAt,
        playedAtISO: play.playedAt.toISOString(),
        playedAtLocal: play.playedAt.toLocaleString(),
        source: play.source,
        daysAgo: Math.floor((Date.now() - play.playedAt.getTime()) / (1000 * 60 * 60 * 24))
      }))
    };

    // Get today's plays count
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    debugInfo.todayPlaysCount = await Play.countDocuments({
      userId,
      playedAt: { $gte: todayStart, $lte: todayEnd }
    });

    debugInfo.todayDateRange = {
      start: todayStart.toISOString(),
      end: todayEnd.toISOString()
    };

    return NextResponse.json(debugInfo, { status: 200 });

  } catch (error) {
    console.error('❌ Debug plays API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
