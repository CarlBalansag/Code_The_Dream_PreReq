<<<<<<< HEAD
import { saveUser } from '@/lib/db/userOperations.js';

//Uses post request to exchange authorization code for an access token
export async function POST(req) {

    let payload;
    try {
        // parse the JSON body from the Post request
        payload = await req.json();
    } catch (error) {
        console.error("Failed to parse JSON body:", error);
=======
import { saveUser } from '@/lib/db/index.js';

export async function POST(req) {
  console.log("🔥 /api/token was hit");

  let payload;
  try {
    payload = await req.json();
  } catch (error) {
    console.error("Failed to parse JSON body:", error);
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
    return new Response(JSON.stringify({ error: "Bad JSON" }), { status: 400 });
  }

<<<<<<< HEAD
    //destruct authorization code and redirect URI from the request
    const { code, redirect_uri } = payload;

    //Spotify client credentials
    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

    //Request to Spotify Account Services, exchange authorization code for access token
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
=======
  const { code, redirect_uri } = payload;

  const CLIENT_ID = "2751136537024052b892a475c49906e1";
  const CLIENT_SECRET = "08a90bbbd1a04c2486bb40daf52d0212";

  const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
    method: "POST",
    headers: {
      Authorization:
        "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
<<<<<<< HEAD
        grant_type: "authorization_code",
        code,
        redirect_uri,
=======
      grant_type: "authorization_code",
      code,
      redirect_uri,
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
    }),
  });

  const tokenData = await tokenResponse.json();
  console.log("🎯 TOKEN RESPONSE:", tokenData);

  // Check if token exchange failed
  if (tokenData.error) {
    console.error("❌ Spotify token error:", tokenData.error_description);
    return new Response(
      JSON.stringify({
        error: tokenData.error,
        error_description: tokenData.error_description
      }),
      { status: 400 }
    );
  }

  // Fetch Spotify profile
  const profileResponse = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  const userProfile = await profileResponse.json();
  console.log("👤 Spotify user profile:", userProfile);

  // Check if profile fetch failed
  if (userProfile.error) {
    console.error("❌ Spotify profile error:", userProfile.error.message);
    return new Response(
      JSON.stringify({
        error: "profile_fetch_failed",
        error_description: userProfile.error.message
      }),
      { status: 401 }
    );
  }

  // Save user to database
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  let savedUser;
  try {
    savedUser = await saveUser({
      spotifyId: userProfile.id,
      displayName: userProfile.display_name,
      email: userProfile.email,
      country: userProfile.country,
      profileImage: userProfile.images?.[0]?.url || '',
      spotifyAccessToken: tokenData.access_token,
      spotifyRefreshToken: tokenData.refresh_token,
      tokenExpiresAt: expiresAt,
    });
    console.log("✅ Saved user to DB:", savedUser.displayName);
  } catch (dbError) {
    console.error("❌ Database error saving user:", dbError);
    return new Response(
      JSON.stringify({
        error: "database_error",
        error_description: dbError.message
      }),
      { status: 500 }
    );
  }

<<<<<<< HEAD
    //parse json response, access token, refresh token.
    const tokenData = await tokenResponse.json();

    // Check if token exchange failed
    if (!tokenResponse.ok || tokenData.error) {
        console.error("Token exchange failed:", tokenData);
        return Response.json(tokenData, { status: tokenResponse.status });
    }

    // Fetch user profile using the access token
    const userResponse = await fetch("https://api.spotify.com/v1/me", {
        headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
        },
    });

    const userData = await userResponse.json();

    // ✅ Save user to database with tokens
    try {
        await saveUser({
            spotifyId: userData.id,
            displayName: userData.display_name,
            email: userData.email,
            country: userData.country,
            profileImage: userData.images?.[0]?.url,
            spotifyAccessToken: tokenData.access_token,
            spotifyRefreshToken: tokenData.refresh_token,
            tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        });
        console.log(`✅ User saved to database: ${userData.display_name}`);
    } catch (error) {
        console.error("❌ Failed to save user to database:", error);
        // Continue anyway - user will be saved on next operation
    }

    // Return formatted response with tokens and user data
    return Response.json({
        tokens: {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_in: tokenData.expires_in,
        },
        user: {
            spotifyId: userData.id,
            displayName: userData.display_name,
            email: userData.email,
            product: userData.product,
            profileImage: userData.images?.[0]?.url,
            images: userData.images,
        },
    });
=======
  // Check if user needs initial import
  let initialImportResult = null;
  if (!savedUser.hasInitialImport) {
    try {
      console.log("🔄 Starting initial import for new user...");
      const { importRecentPlays } = await import('@/lib/services/initialImport.js');
      initialImportResult = await importRecentPlays(savedUser.spotifyId);
      console.log("✅ Initial import completed:", initialImportResult);
    } catch (importError) {
      console.error("⚠️  Initial import failed (non-critical):", importError.message);
      // Don't fail login if import fails
    }
  }

  // Return result to frontend (frontend handles redirect)
  return Response.json({
    user: savedUser,
    tokens: tokenData,
    initialImport: initialImportResult,
  });
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
}
