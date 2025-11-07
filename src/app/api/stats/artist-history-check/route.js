import { hasArtistHistory } from '@/lib/db/play';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const artistId = searchParams.get('artistId');

    if (!userId || !artistId) {
      return NextResponse.json(
        { error: 'userId and artistId are required' },
        { status: 400 }
      );
    }

    const hasHistory = await hasArtistHistory(userId, artistId);

    return NextResponse.json({
      userId,
      artistId,
      hasHistory,
    });
  } catch (error) {
    console.error('❌ Artist history check API error:', error);
    return NextResponse.json(
      { error: error.message, message: 'Failed to check artist history' },
      { status: 500 }
    );
  }
}
