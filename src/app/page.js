"use client";
import { useState, useEffect } from "react";

const REDIRECT_URI = "https://code-the-dream-pre-req-7atz.vercel.app";
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const SCOPES = "user-read-private user-read-email";
const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;

export default function Home() {
  const [code, setCode] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userID, setUserID] = useState(null);
  const [user, setUser] = useState(null); // ✅ Store full user info

  // 🔁 Grab the code from the URL on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get("code");
    setCode(authCode);
  }, []);

  // 🔐 Send the code to backend, get token, get user
  useEffect(() => {
    if (!code) return;

    const fetchTokenAndUser = async () => {
      console.log("📦 Sending code to /api/token...", code);

      const tokenRes = await fetch("/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, redirect_uri: REDIRECT_URI }),
      });

      const tokenData = await tokenRes.json();
      console.log("🔑 Token Response:", tokenData);

      if (tokenData.access_token) {
        const userRes = await fetch("https://api.spotify.com/v1/me", {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });

        const userData = await userRes.json();
        console.log("👤 User:", userData);
        setUser(userData); // ✅ Save to state
        setUserID(userData.id);
        setIsLoggedIn(true);
      }
    };

    fetchTokenAndUser();
  }, [code]);

  const loginToSpotify = () => {
    const url = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=${SCOPES}`;
    window.location.href = url;
  };

  return (
    <div>
      {isLoggedIn && user ? (
          <div className="min-h-screen flex flex-col">
          <div className="w-full h-16 px-6 flex items-center justify-end  shadow-md">
          <img
            src={
              user?.images?.length > 0
                ? user.images[0].url 
                : "/blank_pfp.png"  
            }
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover"
          />
          </div>
    
          {/* 🔽 Main content area */}
          <div className="flex-1 p-6">
          <h1 className="text-center text-3xl mt-20">
            Welcome back, {user.display_name}!
          </h1>
          </div>
          </div>
      ) : (
        <div className="flex items-center justify-center h-screen pb-10">
          <div className="text-center">
            <h1 className="text-4xl pb-5">Log in to Spotify</h1>
            <button
              onClick={loginToSpotify}
              className="w-5/6 bg-[#1db954] text-black text-lg h-12 rounded-3xl"
            >
              Continue to Spotify
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
