<<<<<<< HEAD
=======
import { saveUser } from '@/lib/db/userOperations.js';

//Uses post request to exchange authorization code for an access token
>>>>>>> 5625fef1c0320696788e336f69741fec7df9774c
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
    const REDIRECT_URI = "http://127.0.0.1:3000";
    

    console.log("🧪 CLIENT_ID:", CLIENT_ID);
    console.log("🧪 CODE:", code);
    console.log("🧪 REDIRECT_URI:", redirect_uri);

    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
        Authorization:
        "Basic " +
        Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri, // must match frontend and Spotify Dashboard exactly
    }),
    });

<<<<<<< HEAD
    const data = await tokenResponse.json();
    console.log("🎯 TOKEN RESPONSE:", data);

    return Response.json(data);
=======
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
>>>>>>> 5625fef1c0320696788e336f69741fec7df9774c
}
