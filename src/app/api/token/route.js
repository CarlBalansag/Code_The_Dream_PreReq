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

    const data = await tokenResponse.json();
    console.log("🎯 TOKEN RESPONSE:", data);

    return Response.json(data);
}
