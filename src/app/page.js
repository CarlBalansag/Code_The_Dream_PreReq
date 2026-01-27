"use client";
import CurrentlyPlaying from "./main";
import DropdownMenu from "./component/pages/components/navbar/DropdownMenu";
import SpotifyTour from "./component/pages/components/SpotifyTour";
import Hero from "./component/pages/landing/Hero";
import { useState, useEffect, useCallback } from "react";
import { HelpCircle } from "lucide-react";
import { usePlayTracking } from "@/hooks/usePlayTracking";

const CLIENT_ID = "2751136537024052b892a475c49906e1";
const REDIRECT_URI = "http://127.0.0.1:3000";
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const SCOPES =
  "user-read-recently-played user-read-private user-read-email user-read-currently-playing user-read-playback-state user-modify-playback-state user-top-read user-read-recently-played user-top-read";

export default function Home() {
  const [accessToken, setAccessToken] = useState(null);
  const [code, setCode] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userID, setUserID] = useState(null);
  const [user, setUser] = useState(null);
  const [premium, setPremium] = useState(null);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Handle token refresh callback
  const handleTokenRefresh = useCallback((newToken) => {
    console.log('🔄 Updating access token in app state');
    setAccessToken(newToken);
  }, []);

  // ✅ Enable play tracking when user is logged in
  const { lastPollResult, isPolling } = usePlayTracking(
    user,
    3 * 60 * 1000,
    isLoggedIn
  );

  useEffect(() => {
    if (lastPollResult?.newPlays > 0) {
      console.log(`🎵 Detected ${lastPollResult.newPlays} new plays!`);
    }
  }, [lastPollResult]);

  // ✅ Step 1: Get code from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get("code");
    console.log("🧠 URL Code:", authCode);
    if (authCode) {
      setCode(authCode);
      setIsAuthenticating(true);
    }
  }, []);

  // ✅ Step 2: Reset device notice
  useEffect(() => {
    if (deviceConnected) {
      const timer = setTimeout(() => setDeviceConnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [deviceConnected]);

  // ✅ Step 3: When we get a code, exchange it for tokens + user
  useEffect(() => {
    if (!code) return;

    const fetchTokenAndUser = async () => {
      try {
        console.log("📥 Sending to /api/token:", {
          code,
          redirect_uri: REDIRECT_URI,
        });

        const tokenRes = await fetch("/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            redirect_uri: REDIRECT_URI,
          }),
        });

        if (!tokenRes.ok) {
          const errorText = await tokenRes.text();
          console.error("❌ /api/token failed with status:", tokenRes.status);
          console.error("❌ Full response body:", errorText);
          return;
        }

        const tokenData = await tokenRes.json();
        console.log("🎯 Full Backend Response:", tokenData);

        // ✅ Use backend response to update state
        if (tokenData.tokens?.access_token && tokenData.user) {
          const userData = tokenData.user;

          setUser(userData);
          setUserID(userData.spotifyId);
          setAccessToken(tokenData.tokens.access_token);
          setIsLoggedIn(true);
          
          // 🔧 FIXED: Better premium detection with debug logging
          const isPremium = userData.product === "premium";
          console.log("🎵 Premium Status Check:", {
            product: userData.product,
            isPremium: isPremium,
            userData: userData
          });
          setPremium(isPremium);

          // ✅ Remove ?code= from URL
          window.history.replaceState({}, document.title, "/");
        } else {
          console.warn("⚠️ Missing expected data in response:", tokenData);
        }
      } catch (err) {
        console.error("❌ Error fetching token or user:", err);
      }
    };

    fetchTokenAndUser();
  }, [code]);

  // ✅ Step 4: Show Spotify Tour after first login
  useEffect(() => {
    if (isLoggedIn && user) {
      setMounted(true);
      const hasSeenTour = localStorage.getItem("spotify-tour-completed");
      if (!hasSeenTour) {
        setTimeout(() => setShowTour(true), 1500);
      }
    }
  }, [isLoggedIn, user]);

  const handleTourComplete = () => {
    localStorage.setItem("spotify-tour-completed", "true");
    setShowTour(false);
  };

  const loginToSpotify = () => {
    setIsAuthenticating(true);
    const url = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=${SCOPES}`;
    window.location.href = url;
  };

  return (
    <div className="bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      {isAuthenticating && !isLoggedIn ? (
        // Loading screen during authentication
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              {/* Spinning ring */}
              <div className="w-20 h-20 border-4 border-[#1DB954]/20 border-t-[#1DB954] rounded-full animate-spin"></div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Connecting to Spotify</h2>
              <p className="text-gray-400">Please wait while we authenticate your account...</p>
            </div>
          </div>
        </div>
      ) : isLoggedIn && user ? (
        <div className="min-h-screen flex flex-col">
          {/* REMOVED OLD NAVBAR - Now using new Navbar component in main.js */}

          {/* Main Content */}
          <div className="flex-1 z-1 w-full h-full relative">
            <CurrentlyPlaying
              accessToken={accessToken}
              premium={premium}
              name={user.displayName || user.display_name}
              userId={userID}
              deviceConnected={deviceConnected}
              tourActive={showTour}
              onTokenRefresh={handleTokenRefresh}
              tourButton={
                <button
                  onClick={() => {
                    localStorage.removeItem("spotify-tour-completed");
                    setShowTour(true);
                  }}
                  className="p-2 rounded-full hover:bg-gray-800/50 transition-colors"
                  title="Take a tour"
                >
                  <HelpCircle size={24} className="text-[#1DB954]" />
                </button>
              }
              profileDropdown={
                <DropdownMenu
                  ProfilePicture={user?.profileImage || user?.images?.[0]?.url}
                  UserName={user.displayName || user.display_name}
                  UserProduct={premium ? "premium" : "free"}
                  accessToken={accessToken}
                  userId={userID}
                />
              }
            />
          </div>

          {/* Tour */}
          {showTour && mounted && (
            <SpotifyTour onComplete={handleTourComplete} premium={premium} />
          )}
        </div>
      ) : (
        <Hero onConnectClick={loginToSpotify} />
      )}
    </div>
  );
}