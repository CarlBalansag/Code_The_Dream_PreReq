"use client";
import CurrentlyPlaying from "./component/main";
import { useState, useEffect } from "react";
import DropdownMenu from "./component/DropdownMenu";
const CLIENT_ID = "2751136537024052b892a475c49906e1";
const REDIRECT_URI = "http://127.0.0.1:3000";
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const SCOPES = "user-read-recently-played user-read-private user-read-email user-read-currently-playing user-read-playback-state user-modify-playback-state user-top-read user-read-recently-played user-top-read";

export default function Home() {
  const [accessToken, setAccessToken] = useState(null);
  const [code, setCode] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userID, setUserID] = useState(null);
  const [user, setUser] = useState(null);
  const [premium, setPremium] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get("code");
    setCode(authCode);
  }, []);

  useEffect(() => {
    if (!code) return;

    const fetchTokenAndUser = async () => {
      try {
        const tokenRes = await fetch("/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code, redirect_uri: REDIRECT_URI }),
        });

        if (!tokenRes.ok) {
          const errorText = await tokenRes.text();
          console.error("❌ Token request failed:", errorText);
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
            console.error("❌ User profile fetch failed:", errorText);
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
        console.error("❌ Error fetching token or user:", err);
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
          <div className="w-full h-16 px-6 flex items-center justify-end shadow-md z-2">
            <DropdownMenu ProfilePicture={user?.images?.[0]?.url} UserName={user.display_name} UserProduct={user.product} />
          </div>
          <div className="flex-1 p-6 z-1 w-full h-full relative ">
            <CurrentlyPlaying accessToken={accessToken} premium={premium} name={user.display_name} />
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
