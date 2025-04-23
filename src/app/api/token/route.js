export async function POST(req) {
    console.log("🔥 /api/token was hit");

    const { code, redirect_uri } = await req.json(); // Get it from request

    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

    console.log("🧪 CLIENT_ID:", CLIENT_ID);
    console.log("🧪 REDIRECT_URI:", redirect_uri);
    console.log("🧪 CODE:", code);

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
        redirect_uri, // use exactly what frontend used
    }),
    });

    const data = await tokenResponse.json();
    console.log("🎯 TOKEN RESPONSE:", data);

    return Response.json(data);
}
