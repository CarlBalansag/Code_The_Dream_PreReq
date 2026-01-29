import { getUserBySpotifyId } from '@/lib/db/index.js';
import { NextResponse } from 'next/server';

/**
 * DEBUG ENDPOINT
 * GET /api/debug/user?userId=<spotify_id>
 *
 * Shows user record to debug tracking issues
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const user = await getUserBySpotifyId(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Hide sensitive tokens but show if they exist
    const debugInfo = {
      spotifyId: user.spotifyId,
      displayName: user.displayName,
      hasAccessToken: !!user.spotifyAccessToken,
      hasRefreshToken: !!user.spotifyRefreshToken,
      tokenExpiresAt: user.tokenExpiresAt,
      tokenExpired: user.tokenExpiresAt ? new Date() > new Date(user.tokenExpiresAt) : 'no expiry set',
      lastCheckTimestamp: user.lastCheckTimestamp,
      lastCheckAgo: user.lastCheckTimestamp
        ? `${Math.round((Date.now() - new Date(user.lastCheckTimestamp).getTime()) / 1000 / 60)} minutes ago`
        : 'never',
      backgroundTracking: user.backgroundTracking,
      hasInitialImport: user.hasInitialImport,
      hasFullImport: user.hasFullImport,
      serverTime: new Date().toISOString(),
    };

    return NextResponse.json(debugInfo, { status: 200 });

  } catch (error) {
    console.error('Debug user API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
