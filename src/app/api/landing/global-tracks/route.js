import { NextResponse } from "next/server";

/**
 * API Route: /api/landing/global-tracks
 * Scrapes KWORB for top 5 global daily tracks
 * Returns track title, artist, daily streams, daily change, and Spotify album cover
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
 * Search for track album cover on Spotify
 */
async function getTrackAlbumCover(artistName, trackTitle, accessToken) {
  try {
    const query = `track:${trackTitle} artist:${artistName}`;
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`;

    const response = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error(`Failed to search track: ${artistName} - ${trackTitle}`);
      return null;
    }

    const data = await response.json();
    const track = data.tracks?.items?.[0];

    return track?.album?.images?.[0]?.url || null;
  } catch (error) {
    console.error(`Error fetching album cover for ${artistName} - ${trackTitle}:`, error);
    return null;
  }
}

/**
 * Scrape KWORB for top 5 global daily tracks
 */
async function scrapeKworbTracks() {
  const response = await fetch("https://kworb.net/spotify/country/global_daily.html", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch KWORB: ${response.status}`);
  }

  const html = await response.text();
  const tracks = [];

  // Remove newlines to make regex matching easier
  const cleanHtml = html.replace(/\n/g, "");

  // KWORB table format:
  // <tr><td>Pos</td><td>P+</td><td>Artist - Title</td><td>Days</td><td>Pk</td><td>(x#)</td><td>Streams</td><td>Streams+</td>...</tr>
  const rowMatches = cleanHtml.matchAll(/<tr[^>]*>(.*?)<\/tr>/gi);

  for (const rowMatch of rowMatches) {
    if (tracks.length >= 5) break;

    const rowContent = rowMatch[1];
    const tdMatches = [...rowContent.matchAll(/<td[^>]*>(.*?)<\/td>/gi)];

    if (tdMatches.length < 8) continue;

    // First td is position/rank
    const rankText = tdMatches[0][1].replace(/<[^>]*>/g, "").trim();
    const rank = parseInt(rankText);

    if (isNaN(rank) || rank < 1) continue; // Skip header row

    // Second td is position change (P+)
    const posChangeText = tdMatches[1][1].replace(/<[^>]*>/g, "").trim();

    // Third td contains "Artist - Title" (with links)
    const artistTitleHtml = tdMatches[2][1];
    const artistTitleText = artistTitleHtml.replace(/<[^>]*>/g, "").trim();

    // Split artist and title (format: "Artist - Title")
    const separatorIndex = artistTitleText.indexOf(" - ");
    let artist, title;

    if (separatorIndex !== -1) {
      artist = artistTitleText.substring(0, separatorIndex).trim();
      title = artistTitleText.substring(separatorIndex + 3).trim();
    } else {
      // Handle cases with multiple artists using "/"
      artist = artistTitleText;
      title = artistTitleText;
    }

    // Column indices: 0=Pos, 1=P+, 2=Artist-Title, 3=Days, 4=Pk, 5=(x#), 6=Streams, 7=Streams+
    // Seventh td (index 6) is daily streams
    const streamsText = tdMatches[6][1].replace(/<[^>]*>/g, "").replace(/,/g, "").trim();
    const streams = parseInt(streamsText) || 0;

    // Eighth td (index 7) is daily change (Streams+)
    const dailyChangeText = tdMatches[7][1].replace(/<[^>]*>/g, "").replace(/,/g, "").trim();
    const dailyChange = parseInt(dailyChangeText) || 0;

    if (artist && title) {
      tracks.push({
        id: `gt${rank}`,
        rank,
        artist,
        title,
        positionChange: posChangeText,
        streams,
        dailyChange,
        imageUrl: null,
      });
    }
  }

  if (tracks.length === 0) {
    throw new Error("Could not parse any tracks from KWORB");
  }

  return tracks;
}

/**
 * Format number for display (e.g., 6476141 -> "6.5M")
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
 * Format daily change for display
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
        data: cachedData.tracks,
        lastUpdated: cachedData.lastUpdated,
        cached: true,
      });
    }

    // Scrape KWORB for top 5 tracks
    const tracks = await scrapeKworbTracks();

    // Get Spotify token for album covers
    const accessToken = await getSpotifyToken();

    // Fetch album covers in parallel
    const tracksWithImages = await Promise.all(
      tracks.map(async (track) => {
        const imageUrl = await getTrackAlbumCover(track.artist, track.title, accessToken);
        return {
          ...track,
          imageUrl: imageUrl || null,
          streamsFormatted: formatNumber(track.streams),
          dailyChangeFormatted: formatDailyChange(track.dailyChange),
          isPositive: track.dailyChange >= 0,
        };
      })
    );

    const now = new Date().toISOString();

    // Update cache
    cachedData = {
      tracks: tracksWithImages,
      lastUpdated: now,
    };
    cacheTimestamp = Date.now();

    return NextResponse.json({
      success: true,
      data: tracksWithImages,
      lastUpdated: now,
      cached: false,
    });
  } catch (error) {
    console.error("Error in /api/landing/global-tracks:", error);

    // Return cached data if available, even if stale
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData.tracks,
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
