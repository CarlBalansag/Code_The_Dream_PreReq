<<<<<<< HEAD
import { connectToDB } from '@/lib/mongodb.js';
import { Play } from '@/lib/models/Play.js';
=======
import {
  countUserPlays,
  countUserPlaysInRange,
  getRecentPlays,
} from '@/lib/db/play.js';
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
import { NextResponse } from 'next/server';

/**
 * DEBUG ENDPOINT
 * GET /api/debug/plays?userId=<spotify_id>&limit=20
 *
 * Shows recent plays with full timestamp info to debug timezone issues
 */
export async function GET(req) {
  try {
<<<<<<< HEAD
    await connectToDB();

=======
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

<<<<<<< HEAD
    // Get recent plays
    const plays = await Play.find({ userId })
      .sort({ playedAt: -1 })
      .limit(limit)
      .lean();

    // Format for debugging
    const debugInfo = {
      userId,
      totalPlays: await Play.countDocuments({ userId }),
=======
    const plays = await getRecentPlays(userId, limit);
    // Format for debugging
    const debugInfo = {
      userId,
      totalPlays: await countUserPlays(userId),
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
      serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      serverTime: new Date().toISOString(),
      recentPlays: plays.map(play => ({
        trackName: play.trackName,
        artistName: play.artistName,
        playedAt: play.playedAt,
<<<<<<< HEAD
        playedAtISO: play.playedAt.toISOString(),
        playedAtLocal: play.playedAt.toLocaleString(),
        source: play.source,
        daysAgo: Math.floor((Date.now() - play.playedAt.getTime()) / (1000 * 60 * 60 * 24))
=======
        playedAtISO: play.playedAt?.toISOString(),
        playedAtLocal: play.playedAt?.toLocaleString(),
        source: play.source,
        daysAgo: play.playedAt
          ? Math.floor((Date.now() - play.playedAt.getTime()) / (1000 * 60 * 60 * 24))
          : null,
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
      }))
    };

    // Get today's plays count
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

<<<<<<< HEAD
    debugInfo.todayPlaysCount = await Play.countDocuments({
      userId,
      playedAt: { $gte: todayStart, $lte: todayEnd }
    });
=======
    debugInfo.todayPlaysCount = await countUserPlaysInRange(userId, todayStart, todayEnd);
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600

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
