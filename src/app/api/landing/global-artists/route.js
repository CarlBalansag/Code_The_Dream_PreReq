import { NextResponse } from "next/server";

/**
 * API Route: /api/landing/global-artists
 * Scrapes KWORB for top 5 global artists by monthly listeners
 * Returns artist name, listeners count, daily change, and Spotify image
 */

// Server-side cache (1 hour)
let cachedData = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

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

    // Return the artist image (largest available)
    return artist?.images?.[0]?.url || null;
  } catch (error) {
    console.error(`Error fetching artist image for ${artistName}:`, error);
    return null;
  }
}

/**
 * Scrape KWORB for top 5 artists by monthly listeners
 */
async function scrapeKworbArtists() {
  const response = await fetch("https://kworb.net/spotify/listeners.html", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch KWORB: ${response.status}`);
  }

  const html = await response.text();
  const artists = [];

  // KWORB listeners table format:
  // <tr><td>#</td><td><a>Artist</a></td><td>Listeners</td><td>Daily +/-</td><td>Peak</td><td>PkListeners</td></tr>
  const rowMatches = html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);

  for (const rowMatch of rowMatches) {
    if (artists.length >= 5) break;

    const rowContent = rowMatch[1];
    const tdMatches = [...rowContent.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];

    if (tdMatches.length < 4) continue;

    // First td is rank
    const rankText = tdMatches[0][1].replace(/<[^>]*>/g, "").trim();
    const rank = parseInt(rankText);

    if (isNaN(rank) || rank < 1) continue; // Skip header row

    // Second td contains artist name (with link)
    const artistHtml = tdMatches[1][1];
    const artistName = artistHtml.replace(/<[^>]*>/g, "").trim();

    // Third td is listeners count
    const listenersText = tdMatches[2][1].replace(/<[^>]*>/g, "").replace(/,/g, "").trim();
    const listeners = parseInt(listenersText) || 0;

    // Fourth td is daily change (+/-)
    const dailyChangeText = tdMatches[3][1].replace(/<[^>]*>/g, "").replace(/,/g, "").trim();
    const dailyChange = parseInt(dailyChangeText) || 0;

    if (artistName) {
      artists.push({
        id: `ga${rank}`,
        rank,
        name: artistName,
        listeners,
        dailyChange,
        imageUrl: null,
      });
    }
  }

  if (artists.length === 0) {
    throw new Error("Could not parse any artists from KWORB");
  }

  return artists;
}

/**
 * Format number for display (e.g., 132958010 -> "132.9M")
 */
function formatNumber(num) {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + "B";
  } else if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + "M";
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + "K";
  }
  return num.toLocaleString();
}

/**
 * Format daily change for display (e.g., 524990 -> "+524.9K", -8919 -> "-8.9K")
 */
function formatDailyChange(change) {
  const prefix = change >= 0 ? "+" : "";
  const absChange = Math.abs(change);

  if (absChange >= 1_000_000) {
    return prefix + (change / 1_000_000).toFixed(1) + "M";
  } else if (absChange >= 1_000) {
    return prefix + (change / 1_000).toFixed(1) + "K";
  }
  return prefix + change.toLocaleString();
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    // Check cache first
    if (!forceRefresh && cachedData && Date.now() - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: cachedData.artists,
        lastUpdated: cachedData.lastUpdated,
        cached: true,
      });
    }

    // Scrape KWORB for top 5 artists
    const artists = await scrapeKworbArtists();

    // Get Spotify token for artist images
    const accessToken = await getSpotifyToken();

    // Fetch artist images in parallel
    const artistsWithImages = await Promise.all(
      artists.map(async (artist) => {
        const imageUrl = await getArtistImage(artist.name, accessToken);
        return {
          ...artist,
          imageUrl: imageUrl || null,
          listenersFormatted: formatNumber(artist.listeners),
          dailyChangeFormatted: formatDailyChange(artist.dailyChange),
          isPositive: artist.dailyChange >= 0,
        };
      })
    );

    const now = new Date().toISOString();

    // Update cache
    cachedData = {
      artists: artistsWithImages,
      lastUpdated: now,
    };
    cacheTimestamp = Date.now();

    return NextResponse.json({
      success: true,
      data: artistsWithImages,
      lastUpdated: now,
      cached: false,
    });
  } catch (error) {
    console.error("Error in /api/landing/global-artists:", error);

    // Return cached data if available, even if stale
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData.artists,
        lastUpdated: cachedData.lastUpdated,
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
