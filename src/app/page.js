"use client";
import { useState, useEffect } from "react";
import DropdownMenu from "./component/spotify component/DropdownMenu";
import CurrentlyPlaying from "./component/main";

const REDIRECT_URI = "https://code-the-dream-pre-req-7atz.vercel.app"; //link that tells spotify where to send user back after log in 
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize"; //link for spotify login page
//SCOPES what permissions website is requesting from user
const SCOPES = "user-read-private user-read-email user-read-currently-playing user-read-playback-state user-modify-playback-state user-top-read user-read-recently-played";
const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID; //Spotify unique I

export default function Home() {
  const [accessToken, setAccessToken] = useState(null);   //Stores clients ID
  const [code, setCode] = useState(null);                 //Stores auth code from URL
  const [isLoggedIn, setIsLoggedIn] = useState(false);    //Check if user is logged in 
  const [userID, setUserID] = useState(null);             //Stores Spotify User ID
  const [user, setUser] = useState(null);                 //Store the full User profile
  const [premium, setPremium] = useState(null);           //Checks if User is a premium member

  useEffect(() => {     //On first load extracts the users authorization code after user logs in
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get("code");
    setCode(authCode);
  }, []);

  useEffect(() => {     //fetch access token from backend and retrieve user profile
    if (!code) return;

    const fetchTokenAndUser = async () => {     //fetch for access_token
      try {
        const tokenRes = await fetch("/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code, redirect_uri: REDIRECT_URI }),
        });

        if (!tokenRes.ok) { //If fetch fails
          const errorText = await tokenRes.text();
          console.error("Token request failed:", errorText);
          return;
        }

        const tokenData = await tokenRes.json();

        if (tokenData.access_token) {   //If successful, use access token to fetch user profile
          const userRes = await fetch("https://api.spotify.com/v1/me", {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
            },
          });

          if (!userRes.ok) { // Handle failed user profile fetch
            const errorText = await userRes.text();
            console.error("User profile fetch failed:", errorText);
            return;
          }

          const userData = await userRes.json();

          // Store user data and login state
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
  }, [code]);  // Runs only when `code` useState changes

  //Triggers Spotify login redirect
  const loginToSpotify = () => {
    const url = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=${SCOPES}`;                                //Redirects to spotify log in page 
    window.location.href = url; //Redirects user to Spotify login page
  };

  //Return the page user sees first, Log in page
  return (
    <div>
      {isLoggedIn && user ? (
          <div className="min-h-screen flex flex-col">
            <div className="w-full h-16 px-6 flex items-center justify-end  shadow-md">
              <DropdownMenu ProfilePicture={user?.images?.[0]?.url} UserName={user.display_name} UserProduct={user.product}/>
            </div>
      
            {/*Main content area */}
            <div className="flex-1 p-6">
              <CurrentlyPlaying accessToken={accessToken} premium={premium} />
            </div>
          </div>
      ) : (
        <div className="flex items-center justify-center h-screen pb-10">
          <div className="text-center">
            <h1 className="text-4xl pb-5">Log in to Spotify</h1>
            <button onClick={loginToSpotify}className="w-5/6 bg-[#1db954] text-black text-lg h-12 rounded-3xl">
              Continue to Spotify
            </button>
          </div>
        </div>
      )
    }
    </div>
  );
}
