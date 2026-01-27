import { NextResponse } from 'next/server';

/**
 * GET /api/artist/[artistId]
 * Fetch artist details including genres from Spotify API
 */
export async function GET(req, { params }) {
  try {
    const { artistId } = params;

    // Get access token from Authorization header instead of query params
    const authHeader = req.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!artistId) {
      return NextResponse.json(
        { error: 'artistId is required' },
        { status: 400 }
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'accessToken is required' },
        { status: 401 }
      );
    }

    console.log(`🎨 Fetching artist details for: ${artistId}`);

    // Fetch artist from Spotify API
    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Spotify API error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch artist from Spotify', details: error },
        { status: response.status }
      );
    }

    const artist = await response.json();

    console.log(`✅ Fetched artist: ${artist.name}, genres: ${artist.genres?.join(', ') || 'none'}`);

    return NextResponse.json({
      id: artist.id,
      name: artist.name,
      genres: artist.genres || [],
      image: artist.images?.[0]?.url || null,
      followers: artist.followers?.total || 0,
    });
  } catch (error) {
    console.error('❌ Artist API error:', error);
    return NextResponse.json(
      { error: error.message, message: 'Failed to fetch artist details' },
      { status: 500 }
    );
  }
}
