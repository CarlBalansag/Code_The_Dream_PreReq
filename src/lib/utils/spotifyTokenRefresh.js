import { updateUserTokens } from "../db/userOperations.js";

/**
 * Spotify Token Refresh Utility
 * Handles automatic token refresh when tokens expire
 */

/**
 * Check if user's token needs refresh (expires in < 5 minutes)
 * Works with both Mongoose documents and plain Prisma objects
 * @param {object} user - User object with tokenExpiresAt field
 * @returns {boolean} True if token needs refresh
 */
function needsTokenRefresh(user) {
  // Handle both Mongoose method and plain object
  if (typeof user.needsTokenRefresh === 'function') {
    return user.needsTokenRefresh();
  }
  // Plain object (Prisma) - check manually
  const expiresAt = user.tokenExpiresAt || user.token_expires_at;
  if (!expiresAt) return true;
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  return new Date(expiresAt) <= fiveMinutesFromNow;
}

/**
 * Refresh Spotify access token using refresh token
 * @param {string} refreshToken - User's Spotify refresh token
 * @param {string} spotifyId - User's Spotify ID (for updating database)
 * @returns {object} New access token and expiration
 */
export async function refreshSpotifyToken(refreshToken, spotifyId = null) {
  // Get client credentials from environment
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify client credentials not configured");
  }

  try {
    // Prepare token refresh request
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64"
    );

    // Call Spotify token endpoint
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${authHeader}`,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Token refresh failed: ${error.error_description || error.error}`
      );
    }

    const data = await response.json();

    // Calculate expiration time (typically 3600 seconds = 1 hour)
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    const tokenData = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken, // Use new refresh token if provided
      expiresAt,
    };

    // Update database if spotifyId provided
    if (spotifyId) {
      await updateUserTokens(spotifyId, tokenData);
      console.log(`✅ Tokens refreshed for user: ${spotifyId}`);
    }

    return tokenData;
  } catch (error) {
    console.error("❌ Error refreshing Spotify token:", error.message);
    throw error;
  }
}

/**
 * Get valid access token for user (refresh if needed)
 * @param {object} user - User object from database
 * @returns {string} Valid access token
 */
export async function getValidAccessToken(user) {
  // Check if token needs refresh
  if (needsTokenRefresh(user)) {
    console.log(`🔄 Token expired, refreshing for user: ${user.displayName}`);

    const { accessToken } = await refreshSpotifyToken(
      user.spotifyRefreshToken,
      user.spotifyId
    );

    return accessToken;
  }

  return user.spotifyAccessToken;
}

/**
 * Make a Spotify API request with automatic token refresh
 * @param {string} url - Spotify API endpoint URL
 * @param {object} user - User object from database
 * @param {object} options - Fetch options
 * @returns {object} API response data
 */
export async function spotifyApiRequest(url, user, options = {}) {
  let accessToken = await getValidAccessToken(user);

  // Make initial request
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // If unauthorized, try refreshing token once
  if (response.status === 401) {
    console.log("⚠️  Token invalid, attempting refresh...");

    const { accessToken: newToken } = await refreshSpotifyToken(
      user.spotifyRefreshToken,
      user.spotifyId
    );

    accessToken = newToken;

    // Retry request with new token
    response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Spotify API error (${response.status}): ${error}`
    );
  }

  return response.json();
}

/**
 * Batch refresh tokens for multiple users
 * Useful for background maintenance
 */
export async function batchRefreshTokens(users) {
  const results = {
    success: [],
    failed: [],
  };

  for (const user of users) {
    try {
      if (needsTokenRefresh(user)) {
        await refreshSpotifyToken(user.spotifyRefreshToken, user.spotifyId);
        results.success.push(user.spotifyId);
      }
    } catch (error) {
      results.failed.push({
        spotifyId: user.spotifyId,
        error: error.message,
      });
    }
  }

  return results;
}
