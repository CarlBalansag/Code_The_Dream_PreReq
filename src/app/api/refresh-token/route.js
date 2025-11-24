import { getUserBySpotifyId, updateUserTokens } from '@/lib/db/index.js';

export async function POST(req) {
  console.log("🔄 /api/refresh-token was hit");

  let payload;
  try {
    payload = await req.json();
  } catch (error) {
    console.error("Failed to parse JSON body:", error);
    return new Response(JSON.stringify({ error: "Bad JSON" }), { status: 400 });
  }

  const { userId } = payload;

  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });
  }

  try {
    // Get user from database to retrieve refresh token
    const user = await getUserBySpotifyId(userId);

    if (!user || !user.spotifyRefreshToken) {
      console.error("❌ No refresh token found for user:", userId);
      return new Response(
        JSON.stringify({ error: "No refresh token found. Please login again." }),
        { status: 401 }
      );
    }

    const CLIENT_ID = "2751136537024052b892a475c49906e1";
    const CLIENT_SECRET = "08a90bbbd1a04c2486bb40daf52d0212";

    // Request new access token using refresh token
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: user.spotifyRefreshToken,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error("❌ Spotify refresh error:", tokenData.error_description);
      return new Response(
        JSON.stringify({
          error: tokenData.error,
          error_description: tokenData.error_description,
        }),
        { status: 400 }
      );
    }

    // Calculate new expiration time
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // Update user tokens in database
    await updateUserTokens(userId, {
      accessToken: tokenData.access_token,
      // Refresh token might be returned (Spotify sometimes rotates it)
      refreshToken: tokenData.refresh_token || user.spotifyRefreshToken,
      expiresAt: expiresAt,
    });

    console.log("✅ Token refreshed for user:", userId);

    return Response.json({
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
    });
  } catch (error) {
    console.error("❌ Error refreshing token:", error);
    return new Response(
      JSON.stringify({ error: "Failed to refresh token", details: error.message }),
      { status: 500 }
    );
  }
}
