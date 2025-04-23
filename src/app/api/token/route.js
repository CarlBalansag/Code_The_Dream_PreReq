export async function POST(req) {
    console.log("🔥 /api/token was hit");
    const { code } = await req.json();

    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

    console.log("🧪 CLIENT_ID:", CLIENT_ID);
    console.log("🧪 CODE:", code);

    const REDIRECT_URI = "https://code-the-dream-pre-req-7atz.vercel.app/"; // use your deployed URL

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
        redirect_uri: REDIRECT_URI,
    }),
    });

    const data = await tokenResponse.json();
    console.log("🎯 TOKEN RESPONSE:", data);

    return Response.json(data);
}
