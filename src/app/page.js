"use client";
import CurrentlyPlaying from "./main";
import DropdownMenu from "./component/pages/components/navbar/DropdownMenu";
import SpotifyTour from "./component/pages/components/SpotifyTour";
import { useState, useEffect } from "react";
import { HelpCircle, Music, TrendingUp, BarChart3, Clock } from "lucide-react";
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
    const url = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=${SCOPES}`;
    window.location.href = url;
  };

  return (
    <div className="bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      {isLoggedIn && user ? (
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
        <div className="flex items-center justify-center min-h-screen px-4 py-12">
          <div className="max-w-md w-full">
            {/* Logo/Branding */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#1DB954] to-[#1ed760] flex items-center justify-center shadow-[0_0_40px_rgba(29,185,84,0.4)]">
                <Music size={40} className="text-black" />
              </div>
              <h1 className="text-4xl font-bold mb-2">Spotify Tracker</h1>
              <p className="text-gray-200 text-lg">
                Discover your music journey
              </p>
            </div>

            {/* Feature highlights */}
            <div className="space-y-3 mb-8">
              {[
                { icon: TrendingUp, text: "Track your top artists and songs" },
                { icon: BarChart3, text: "Visualize your listening history" },
                { icon: Clock, text: "See your music evolution over time" },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-gray-200">
                  <feature.icon size={20} className="text-[#1DB954] flex-shrink-0" />
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button
              onClick={loginToSpotify}
              className="w-full bg-[#1db954] text-black text-lg font-semibold py-4 rounded-full hover:bg-[#1ed760] transition-all transform hover:scale-105 active:scale-95 shadow-lg"
            >
              Connect with Spotify
            </button>

            {/* Privacy note */}
            <p className="text-gray-500 text-xs text-center mt-4">
              We only access your listening data. Your credentials stay secure with Spotify.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}