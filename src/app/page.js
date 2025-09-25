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
    <div className="h-screen flex flex-col justify-center items-center text-center">
      <h1 className="text-4xl mb-6">Welcome to Your Spotify Dashboard</h1>
      <button
        onClick={loginWithSpotify}
        className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full text-lg"
      >
        Log In with Spotify
      </button>
    </div>
  );
}
