//Uses post request to exchange authorization code for an access token
export async function POST(req) {

    let payload;
    try {
        // parse the JSON body from the Post request
        payload = await req.json();
    } catch (error) {
        console.error("Failed to parse JSON body:", error);
    return new Response(JSON.stringify({ error: "Bad JSON" }), { status: 400 });
    }

    //destruct authorization code and redirect URI from the request
    const { code, redirect_uri } = payload;

    //Spotify client credentials
    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

    //Request to Spotify Account Services, exchange authorization code for access token
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
        redirect_uri,
    }),
    });

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
}
