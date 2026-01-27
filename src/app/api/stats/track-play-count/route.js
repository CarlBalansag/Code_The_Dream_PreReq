import prisma from '@/lib/prisma.js';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const trackId = searchParams.get('trackId');

    if (!userId || !trackId) {
      return NextResponse.json(
        { error: 'userId and trackId are required' },
        { status: 400 }
      );
    }

    console.log(`🎵 Fetching play count for track ${trackId} and user ${userId}`);

    // Count plays for this track by this user
    const playCount = await prisma.plays.count({
      where: {
        user_id: userId,
        track_id: trackId,
      },
    });

    console.log(`✅ Found ${playCount} plays`);

    return NextResponse.json({
      userId,
      trackId,
      playCount,
    });
  } catch (error) {
    console.error('❌ Track play count API error:', error);
    return NextResponse.json(
      { error: error.message, message: 'Failed to fetch track play count' },
      { status: 500 }
    );
  }
}
