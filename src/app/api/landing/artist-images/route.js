import { NextResponse } from "next/server";

/**
 * API Route: /api/landing/artist-images
 * Fetches artist images from Spotify using Client Credentials flow
 * Used for landing page preview (no user auth required)
 */

// Cache the results for 24 hours (artist images don't change often)
let cachedData = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get Spotify access token using Client Credentials flow
 */
async function getSpotifyToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials not configured");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error("Failed to get Spotify token");
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Search for artist image on Spotify
 */
async function getArtistImage(artistName, accessToken) {
  try {
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`;

    const response = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error(`Failed to search artist: ${artistName}`);
      return null;
    }

    const data = await response.json();
    const artist = data.artists?.items?.[0];

    // Return the artist image (largest available) and Spotify ID
    return {
      imageUrl: artist?.images?.[0]?.url || null,
      spotifyId: artist?.id || null,
      name: artist?.name || artistName,
    };
  } catch (error) {
    console.error(`Error fetching image for ${artistName}:`, error);
    return null;
  }
}

// Default artists to fetch (used in LivePulse preview)
const DEFAULT_ARTISTS = [
  "Frank Ocean",
  "Taylor Swift",
  "Bruno Mars",
  "SZA",
  "Drake"
];

export async function GET(request) {
  try {
    // Get artists from query params or use defaults
    const { searchParams } = new URL(request.url);
    const artistsParam = searchParams.get('artists');
    const forceRefresh = searchParams.get('refresh') === 'true';

    const artistNames = artistsParam
      ? artistsParam.split(',').map(a => a.trim())
      : DEFAULT_ARTISTS;

    // Create cache key based on artist names
    const cacheKey = artistNames.join(',').toLowerCase();

    // Check cache first (skip if force refresh)
    if (!forceRefresh && cachedData?.key === cacheKey && Date.now() - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: cachedData.artists,
        cached: true,
      });
    }

    // Get Spotify token
    const accessToken = await getSpotifyToken();

    // Fetch artist images in parallel
    const artistsWithImages = await Promise.all(
      artistNames.map(async (name, index) => {
        const artistData = await getArtistImage(name, accessToken);
        return {
          id: artistData?.spotifyId || `artist-${index + 1}`,
          name: artistData?.name || name,
          imageUrl: artistData?.imageUrl || null,
          plays: Math.floor(Math.random() * 200) + 150, // Random plays for demo
        };
      })
    );

    // Update cache
    cachedData = {
      key: cacheKey,
      artists: artistsWithImages,
    };
    cacheTimestamp = Date.now();

    return NextResponse.json({
      success: true,
      data: artistsWithImages,
      cached: false,
    });
  } catch (error) {
    console.error("Error in /api/landing/artist-images:", error);

    // Return cached data if available, even if stale
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData.artists,
        cached: true,
        stale: true,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
