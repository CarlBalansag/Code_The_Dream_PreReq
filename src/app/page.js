// ✅ /app/page.js
"use client";
const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = "https://spotify.carltechs.com/home";
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const SCOPES = [
  "user-read-private",
  "user-read-email",
  "user-top-read",
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-recently-played"
].join(" ");

export default function LoginPage() {
  const loginWithSpotify = () => {
    const authURL = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=${encodeURIComponent(SCOPES)}`;
    window.location.href = authURL;
  };

  return (
    <div className="flex items-center justify-center h-screen pb-10">
      <div className="text-center">
        <h1 className="text-4xl pb-5">Log in to Spotify</h1>
        <button
          onClick={loginWithSpotify}
          className="w-5/6 bg-[#1db954] text-black text-lg h-12 rounded-3xl"
        >
          Continue to Spotify
        </button>
      </div>
    </div>
  );
}

