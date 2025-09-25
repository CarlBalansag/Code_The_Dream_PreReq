"use client";
import { useState, useEffect } from "react";
import CurrentlyPlaying from "../main"; // update path if needed
import SpotifyDeviceStatus from "../component/pages/components/navbar/connected_device";
import DropdownMenu from "../component/pages/components/navbar/DropdownMenu";

// Spotify Auth Settings
const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = "https://spotify.carltechs.com/home"; // make sure this matches the Spotify dashboard
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const SCOPES = [
  "user-read-recently-played",
  "user-read-private",
  "user-read-email",
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-top-read",
].join(" ");

export default function Home() {
  const [accessToken, setAccessToken] = useState(null);
  const [code, setCode] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userID, setUserID] = useState(null);
  const [user, setUser] = useState(null);
  const [premium, setPremium] = useState(null);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [loading, setLoading] = useState(true); // 🆕 loading state

  // Get ?code from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get("code");
    if (authCode) setCode(authCode);
  }, []);

  // Optional: Device connection status timeout
  useEffect(() => {
    if (deviceConnected) {
      const timer = setTimeout(() => setDeviceConnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [deviceConnected]);

  // Handle token & fetch user
  useEffect(() => {
    if (!code) {
      setLoading(false); // no code = not logged in
      return;
    }

    const fetchTokenAndUser = async () => {
      try {
        const tokenRes = await fetch("/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, redirect_uri: REDIRECT_URI }),
        });

        if (!tokenRes.ok) {
          console.error("Token request failed:", await tokenRes.text());
          setLoading(false);
          return;
        }

        const tokenData = await tokenRes.json();
        if (tokenData.access_token) {
          const userRes = await fetch("https://api.spotify.com/v1/me", {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
            },
          });

          if (!userRes.ok) {
            console.error("User profile fetch failed:", await userRes.text());
            setLoading(false);
            return;
          }

          const userData = await userRes.json();
          setUser(userData);
          setUserID(userData.id);
          setAccessToken(tokenData.access_token);
          setIsLoggedIn(true);
          setPremium(userData.product === "premium");
        }
      } catch (err) {
        console.error("Error fetching token or user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTokenAndUser();
  }, [code]);

  // Spotify login button
  const loginToSpotify = () => {
    const url = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=${encodeURIComponent(SCOPES)}`;
    window.location.href = url;
  };

  // === 🧠 WHAT THE UI RENDERS ===

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl">Loading your Spotify Dashboard...</p>
      </div>
    );
  }

  if (isLoggedIn && user) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Navbar */}
        <div className="w-full h-16 px-6 flex items-center justify-between shadow-md z-2 mb-10">
          <div className="mb-6">
            <SpotifyDeviceStatus
              accessToken={accessToken}
              onDeviceConnect={() => setDeviceConnected(true)}
            />
          </div>
          <DropdownMenu
            ProfilePicture={user?.images?.[0]?.url}
            UserName={user.display_name}
            UserProduct={user.product}
            accessToken={accessToken}
          />
        </div>

        {/* Main Dashboard */}
        <div className="flex-1 p-6 z-1 w-full h-full relative ">
          <CurrentlyPlaying
            accessToken={accessToken}
            premium={premium}
            name={user.display_name}
            deviceConnected={deviceConnected}
          />
        </div>
      </div>
    );
  }

  // Not logged in
  return (
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
  );
}
