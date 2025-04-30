"use client";
import { useState, useEffect } from "react";
import CurrentlyPlaying from "./component/current_playing";
const REDIRECT_URI = "https://code-the-dream-pre-req-7atz.vercel.app";
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const SCOPES = "user-read-private user-read-email";
const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;

export default function Home() {
  const [accessToken, setAccessToken] = useState(null);                                                      //Stores clients ID
  const [code, setCode] = useState(null);                                                                    //Stores url after redirect
  const [isLoggedIn, setIsLoggedIn] = useState(false);                                                       //Check if user is logged in 
  const [userID, setUserID] = useState(null);
  const [user, setUser] = useState(null); 
  const [premium, setPremium] = useState(null);  

  useEffect(() => {                                                                                           //After user succesfully logs in --> stores the url spotify returns into code
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get("code");
    setCode(authCode);
  }, []);

  useEffect(() => {
    if (!code) return;                                                                                        //Check if spotify gave u "code" after sign up

    const fetchTokenAndUser = async () => {                                                                   //Send request to (/api/token) exchanging code for token
      const tokenRes = await fetch("/api/token", {                                                      
        method: "POST",
        headers: {
          "Content-Type": "application/json",                                                                 //sends in client_id, client_secret_code, redirect_uri
        },
        body: JSON.stringify({ code, redirect_uri: REDIRECT_URI }),                       
      });

      const tokenData = await tokenRes.json();                                                                //Returns access_token, refresh_token, expires_in, scope
      console.log("🔑 Token Response:", tokenData);

      if (tokenData.access_token) {
        setAccessToken(tokenData.access_token);                                                               //Saves access_token
        const userRes = await fetch("https://api.spotify.com/v1/me", {                                        //Fetches users profile using the token
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });
      
        const userData = await userRes.json();                                                                //Returns User info
        console.log("👤 User:", userData);                                                                    
        setUser(userData);                                                    
        setUserID(userData.id);
        setIsLoggedIn(true);
        setPremium(userData.product === "premium" ? true : false);
      }      
    };
    fetchTokenAndUser();
  }, [code]); 

  const loginToSpotify = () => {
    const url = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=${SCOPES}`;                                //Redirects to spotify log in page 
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
          <CurrentlyPlaying accessToken={accessToken} premium={premium} />
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
      )
    }
    </div>
  );
}
