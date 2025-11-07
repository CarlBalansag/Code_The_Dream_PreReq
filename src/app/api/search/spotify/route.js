import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '5');
    const accessToken = searchParams.get('accessToken');

    if (!query || query.length < 1) {
      return NextResponse.json(
        { error: 'Query must be at least 1 character' },
        { status: 400 }
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 401 }
      );
    }

    console.log(`🔍 Searching Spotify for: "${query}"`);

    // Call Spotify Search API
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist,track&limit=${limit}`,
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
        { error: 'Failed to search Spotify', details: error },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Format artists
    const artists = data.artists?.items.slice(0, Math.ceil(limit / 2)).map((artist) => ({
      id: artist.id,
      name: artist.name,
      image: artist.images[0]?.url || null,
      followers: artist.followers?.total || 0,
      type: 'artist',
    })) || [];

    // Format tracks
    const tracks = data.tracks?.items.slice(0, Math.floor(limit / 2)).map((track) => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0]?.name || 'Unknown Artist',
      artistId: track.artists[0]?.id || null,
      album: track.album?.name || 'Unknown Album',
      image: track.album?.images[0]?.url || null,
      duration: track.duration_ms,
      releaseDate: track.album?.release_date || null,
      type: 'track',
    })) || [];

    console.log(`✅ Found ${artists.length} artists and ${tracks.length} tracks`);

    return NextResponse.json({
      artists,
      tracks,
      total: artists.length + tracks.length,
    });
  } catch (error) {
    console.error('❌ Search API error:', error);
    return NextResponse.json(
      { error: error.message, message: 'Failed to search Spotify' },
      { status: 500 }
    );
  }
}
