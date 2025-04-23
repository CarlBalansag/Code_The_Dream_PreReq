export async function POST(req) {
    const { code } = await req.json();

    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
    const REDIRECT_URI = "http://127.0.0.1:3000";

    console.log("🧪 CLIENT_ID:", CLIENT_ID);
    console.log("🧪 CLIENT_SECRET:", CLIENT_SECRET);

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
    return Response.json(data);
}
