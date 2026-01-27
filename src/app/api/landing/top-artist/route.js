import { NextResponse } from "next/server";

/**
 * API Route: /api/landing/top-artist
 * Scrapes KWORB for top 3 global daily tracks and fetches artist images from Spotify
 */

// Cache the results for 1 hour to avoid hitting KWORB too often
let cachedData = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const CACHE_VERSION = 2; // Increment to invalidate cache after code changes

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
    // Search for the track with artist and title
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

    // Return the album cover (largest image available)
    return track?.album?.images?.[0]?.url || null;
  } catch (error) {
    console.error(`Error fetching album cover for ${artistName} - ${trackTitle}:`, error);
    return null;
  }
}

/**
 * Scrape KWORB for top 3 global daily tracks
 */
async function scrapeKworb() {
  const response = await fetch("https://kworb.net/spotify/country/global_daily.html", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch KWORB: ${response.status}`);
  }

  const html = await response.text();
  const tracks = [];

  // KWORB table has rows like:
  // <tr><td>1</td><td>...</td><td><a href="...">Artist</a> - <a href="...">Song</a></td><td>days</td>...<td>total</td></tr>
  // We need to find rows and extract: position, artist-song text, days, and total streams

  // Find all table rows
  const rowMatches = html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);

  for (const rowMatch of rowMatches) {
    if (tracks.length >= 3) break;

    const rowContent = rowMatch[1];

    // Extract all <td> contents
    const tdMatches = [...rowContent.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];

    if (tdMatches.length < 9) continue; // Skip rows without enough columns

    // First td should be position number
    const posText = tdMatches[0][1].replace(/<[^>]*>/g, '').trim();
    const position = parseInt(posText);

    if (isNaN(position) || position < 1) continue; // Skip header row

    // Third td contains artist - song (with links)
    const artistSongHtml = tdMatches[2][1];
    // Remove HTML tags to get clean text
    const artistSongText = artistSongHtml.replace(/<[^>]*>/g, '').trim();

    // Fourth td is days
    const daysText = tdMatches[3][1].replace(/<[^>]*>/g, '').trim();
    const days = parseInt(daysText) || 0;

    // Last td (9th) is total streams
    const totalText = tdMatches[8][1].replace(/<[^>]*>/g, '').replace(/,/g, '').trim();
    const totalStreams = parseInt(totalText) || 0;

    // Split artist and title (format: "Artist - Title")
    const separatorIndex = artistSongText.indexOf(" - ");
    let artist, title;

    if (separatorIndex !== -1) {
      artist = artistSongText.substring(0, separatorIndex).trim();
      title = artistSongText.substring(separatorIndex + 3).trim();
    } else {
      artist = artistSongText;
      title = artistSongText;
    }

    if (artist && title) {
      tracks.push({
        rank: position,
        artist,
        title,
        days,
        streams: totalStreams,
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
 * Format stream count for display (e.g., 2,040,588,713 -> "2.04B")
 */
function formatStreams(streams) {
  if (streams >= 1_000_000_000) {
    return (streams / 1_000_000_000).toFixed(2) + "B";
  } else if (streams >= 1_000_000) {
    return (streams / 1_000_000).toFixed(1) + "M";
  } else if (streams >= 1_000) {
    return (streams / 1_000).toFixed(1) + "K";
  }
  return streams.toString();
}

export async function GET(request) {
  try {
    // Check for force refresh query param
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Check cache first (skip if force refresh)
    if (!forceRefresh && cachedData && Date.now() - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
      });
    }

    // Scrape KWORB for top 3 tracks
    const tracks = await scrapeKworb();

    // Get Spotify token for album cover search
    const accessToken = await getSpotifyToken();

    // Fetch album covers in parallel
    const tracksWithImages = await Promise.all(
      tracks.map(async (track) => {
        const imageUrl = await getTrackAlbumCover(track.artist, track.title, accessToken);
        return {
          ...track,
          imageUrl: imageUrl || "/images/default-album.png", // Fallback image
          streamsFormatted: formatStreams(track.streams),
        };
      })
    );

    // Update cache
    cachedData = tracksWithImages;
    cacheTimestamp = Date.now();

    return NextResponse.json({
      success: true,
      data: tracksWithImages,
      cached: false,
    });
  } catch (error) {
    console.error("Error in /api/landing/top-artist:", error);

    // Return cached data if available, even if stale
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
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
