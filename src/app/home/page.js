"use client";
import { useState, useEffect } from "react";
import CurrentlyPlaying from "../main"; // adjust this path if needed
import SpotifyDeviceStatus from "../component/pages/components/navbar/connected_device";
import DropdownMenu from "../component/pages/components/navbar/DropdownMenu";

const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = "https://spotify.carltechs.com/home";
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const SCOPES = "user-read-recently-played user-read-private user-read-email user-read-currently-playing user-read-playback-state user-modify-playback-state user-top-read";

export default function Home() {
  const [accessToken, setAccessToken] = useState(null);
  const [code, setCode] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userID, setUserID] = useState(null);
  const [user, setUser] = useState(null);
  const [premium, setPremium] = useState(null);
  const [deviceConnected, setDeviceConnected] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get("code");
    if (authCode) setCode(authCode);
  }, []);

  useEffect(() => {
    if (deviceConnected) {
      const timer = setTimeout(() => setDeviceConnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [deviceConnected]);

  useEffect(() => {
    if (!code) return;

    const fetchTokenAndUser = async () => {
      try {
        const tokenRes = await fetch("/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, redirect_uri: REDIRECT_URI }),
        });

        if (!tokenRes.ok) {
          const errorText = await tokenRes.text();
          console.error("Token request failed:", errorText);
          return;
        }

        const tokenData = await tokenRes.json();
        console.log("🔑 Token Response:", tokenData);

        if (tokenData.access_token) {
          const userRes = await fetch("https://api.spotify.com/v1/me", {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
            },
          });

          if (!userRes.ok) {
            const errorText = await userRes.text();
            console.error("User profile fetch failed:", errorText);
            return;
          }

          const userData = await userRes.json();
          console.log("👤 User:", userData);

          setUser(userData);
          setUserID(userData.id);
          setAccessToken(tokenData.access_token);
          setIsLoggedIn(true);
          setPremium(userData.product === "premium");
        }
      } catch (err) {
        console.error("Error fetching token or user:", err);
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
          <div id="navbar" className="w-full h-16 px-6 flex items-center justify-between shadow-md z-2 mb-10">
            <div className="mb-6">
              <SpotifyDeviceStatus accessToken={accessToken} onDeviceConnect={() => setDeviceConnected(true)} />
            </div>
            <DropdownMenu ProfilePicture={user?.images?.[0]?.url} UserName={user.display_name} UserProduct={user.product} accessToken={accessToken} />
          </div>
          <div className="flex-1 p-6 z-1 w-full h-full relative ">
            <CurrentlyPlaying accessToken={accessToken} premium={premium} name={user.display_name} deviceConnected={deviceConnected} />
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
