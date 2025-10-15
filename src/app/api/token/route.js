import { connectToDB } from '@/lib/mongodb.js';
import { saveUser } from '@/lib/db/index.js';

export async function POST(req) {
  console.log("🔥 /api/token was hit");

  let payload;
  try {
    payload = await req.json();
  } catch (error) {
    console.error("Failed to parse JSON body:", error);
    return new Response(JSON.stringify({ error: "Bad JSON" }), { status: 400 });
  }

  const { code, redirect_uri } = payload;

  const CLIENT_ID = "2751136537024052b892a475c49906e1";
  const CLIENT_SECRET = "08a90bbbd1a04c2486bb40daf52d0212";

  const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri,
    }),
  });

  const tokenData = await tokenResponse.json();
  console.log("🎯 TOKEN RESPONSE:", tokenData);

  // Fetch Spotify profile
  const profileResponse = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  const userProfile = await profileResponse.json();
  console.log("👤 Spotify user profile:", userProfile);

  // Save user to MongoDB
  await connectToDB();

  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  const savedUser = await saveUser({
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
}
