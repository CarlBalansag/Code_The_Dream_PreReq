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
    const data = await tokenResponse.json();
    return Response.json(data);
}
