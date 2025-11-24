import { NextResponse } from 'next/server';

/**
 * Fetch real Spotify charts from Kworb.net
 * Scrapes artist and track data from public charts
 */
export async function GET(req) {
  console.log("🌍 /api/charts/global was hit");

  try {
    // Fetch top artists from kworb.net
    const artistsResponse = await fetch('https://kworb.net/spotify/artists.html', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!artistsResponse.ok) {
      console.error("❌ Failed to fetch artists page:", artistsResponse.status);
      throw new Error('Failed to fetch artists');
    }

    const artistsHtml = await artistsResponse.text();

    // Fetch top tracks from kworb.net
    const tracksResponse = await fetch('https://kworb.net/spotify/country/global_daily.html', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!tracksResponse.ok) {
      console.error("❌ Failed to fetch tracks page:", tracksResponse.status);
      throw new Error('Failed to fetch tracks');
    }

    const tracksHtml = await tracksResponse.text();

    // Parse artists HTML
    const artists = parseArtists(artistsHtml);
    console.log("✅ Parsed", artists.length, "artists");

    // Parse tracks HTML
    const tracks = parseTracks(tracksHtml);
    console.log("✅ Parsed", tracks.length, "tracks");

    // Fetch real images from Spotify
    const CLIENT_ID = "2751136537024052b892a475c49906e1";
    const CLIENT_SECRET = "08a90bbbd1a04c2486bb40daf52d0212";

    // Get Spotify access token
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
      }),
    });

    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json();

      // Fetch images for artists
      await fetchSpotifyImages(artists, tokenData.access_token, 'artist');

      // Fetch images for tracks
      await fetchSpotifyImages(tracks, tokenData.access_token, 'track');
    }

    return NextResponse.json({
      artists: artists.slice(0, 5),
      tracks: tracks.slice(0, 5),
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error("❌ Error fetching charts:", error);
    return NextResponse.json(
      { error: "Failed to fetch charts", details: error.message },
      { status: 500 }
    );
  }
}

function parseArtists(html) {
  const artists = [];

  try {
    // Extract table rows using regex (simple parsing)
    const tableMatch = html.match(/<table[^>]*>(.*?)<\/table>/s);
    if (!tableMatch) return [];

    const rowMatches = [...tableMatch[1].matchAll(/<tr[^>]*>(.*?)<\/tr>/gs)];

    for (let i = 1; i <= 10 && i < rowMatches.length; i++) { // Skip header, get top 10
      const row = rowMatches[i][1];

      // Extract artist name
      const nameMatch = row.match(/<a[^>]*>([^<]+)<\/a>/);
      const name = nameMatch ? nameMatch[1].trim() : null;

      // Extract all td elements
      const tds = [...row.matchAll(/<td[^>]*>(.*?)<\/td>/gs)];

      // Kworb structure: Rank, Artist, Total, Daily, As lead, Solo, As feature
      const dailyStreamsRaw = parseCount(tds[3] ? tds[3][1] : '0');
      const dailyStreams = formatNumberWithCommas(dailyStreamsRaw);
      // Extract trend from total streams delta; keep old behavior as a placeholder signal
      const dailyChange = tds[2] ? tds[2][1].replace(/<[^>]*>/g, '').trim() : '+0';

      if (name) {
        artists.push({
          id: `artist-${i}`,
          name,
          listeners: `${dailyStreams} daily streams`,
          dailyStreams,
          dailyStreamsRaw,
          trend: formatTrend(dailyChange),
          img: `https://via.placeholder.com/100/1DB954/ffffff?text=${encodeURIComponent(name.charAt(0))}`,
        });
      }
    }
  } catch (error) {
    console.error("Error parsing artists:", error);
  }

  // Sort descending by daily streams before returning
  return artists.sort((a, b) => (b.dailyStreamsRaw || 0) - (a.dailyStreamsRaw || 0));
}

function parseTracks(html) {
  const tracks = [];

  try {
    // Extract table rows
    const tableMatch = html.match(/<table[^>]*>(.*?)<\/table>/s);
    if (!tableMatch) return [];

    const rowMatches = [...tableMatch[1].matchAll(/<tr[^>]*>(.*?)<\/tr>/gs)];

    for (let i = 1; i <= 10 && i < rowMatches.length; i++) { // Skip header, get top 10
      const row = rowMatches[i][1];

      // Extract track title and artist
      const linkMatch = row.match(/<a[^>]*>([^<]+)<\/a>/);
      const fullTitle = linkMatch ? linkMatch[1].trim() : null;

      if (fullTitle) {
        // KWORB track column uses "Track - Artist" format
        const parts = fullTitle.split(' - ');
        const title = parts[0] || fullTitle;
        const artist = parts[1] || parts[0] || 'Unknown Artist';

        // Extract daily streams from kworb table
        // Kworb global_daily structure: Rank, Track, Streams (total), Streams (daily)
        const tds = [...row.matchAll(/<td[^>]*>(.*?)<\/td>/gs)];
        const dailyStreamsRaw = parseCount(tds[3] ? tds[3][1] : '0');
        const dailyStreams = formatNumberWithCommas(dailyStreamsRaw);

        tracks.push({
          id: `track-${i}`,
          title,
          artist,
          plays: `${dailyStreams} daily streams`,
          dailyStreamsRaw,
          img: `https://via.placeholder.com/100/1ed760/000000?text=${encodeURIComponent(title.charAt(0))}`,
        });
      }
    }
  } catch (error) {
    console.error("Error parsing tracks:", error);
  }

  // Already ordered by rank in KWORB, but ensure descending by daily streams
  return tracks.sort((a, b) => (b.dailyStreamsRaw || 0) - (a.dailyStreamsRaw || 0));
}

// Helper functions
function formatNumber(numStr) {
  // Convert "123,456,789" to "123M"
  const num = parseInt(numStr.replace(/,/g, ''));
  if (isNaN(num)) return '0';

  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B`;
  } else if (num >= 1000000) {
    return `${Math.floor(num / 1000000)}M`;
  } else if (num >= 1000) {
    return `${Math.floor(num / 1000)}K`;
  }
  return num.toString();
}

function formatWithCommas(numStr) {
  const num = parseInt(numStr.replace(/,/g, ''));
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US');
}

function cleanNumber(str) {
  return str.replace(/<[^>]*>/g, '').trim();
}

function formatNumberWithCommas(num) {
  if (typeof num !== 'number' || !Number.isFinite(num)) return '0';
  return num.toLocaleString('en-US');
}

function parseCount(str) {
  if (!str) return 0;
  const cleaned = str.replace(/<[^>]*>/g, '').trim().toLowerCase();
  const multiplier = cleaned.includes('k') ? 1000 : cleaned.includes('m') ? 1000000 : 1;
  const numeric = cleaned.replace(/[^0-9.]/g, '');
  const value = parseFloat(numeric);
  if (isNaN(value)) return 0;
  return Math.round(value * multiplier);
}

function formatTrend(changeStr) {
  // Extract number from strings like "+1,234" or "-567"
  const match = changeStr.match(/([+-]?\d+)/);
  if (!match) return '+0%';

  const num = parseInt(match[1]);
  if (num > 0) return `+${(num / 10000).toFixed(1)}%`;
  if (num < 0) return `${(num / 10000).toFixed(1)}%`;
  return '+0%';
}

async function fetchSpotifyImages(items, accessToken, type) {
  // Fetch images for each item from Spotify
  for (const item of items) {
    try {
      let searchQuery, imageField;

      if (type === 'artist') {
        searchQuery = item.name;
        const response = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=artist&limit=1`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const artist = data.artists?.items?.[0];
          if (artist?.images?.[0]?.url) {
            item.img = artist.images[0].url;
          }
        }
      } else if (type === 'track') {
        // Search for track
        searchQuery = `${item.artist} ${item.title}`;
        const response = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=1`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const track = data.tracks?.items?.[0];
          if (track?.album?.images?.[0]?.url) {
            item.img = track.album.images[0].url;
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching image for ${item.name || item.title}:`, error);
      // Keep placeholder image on error
    }
  }
}
