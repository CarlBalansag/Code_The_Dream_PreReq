"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

import PlayPauseToggle from "../components/control_bar/play_pause_button";
import Next_Button from "../components/control_bar/next_button";
import Previous_Button from "../components/control_bar/previous_button";

// Moved here from main.js
export async function fetchCurrentlyPlaying(accessToken) {
  try {
    const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.status === 204) return null;
    if (!res.ok) {
      console.error("Error fetching currently playing:", res.status);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error("Fetch error:", error);
    return null;
  }
}

export default function LiveSong({ song, isPlaying, accessToken, getSong, onLoadingChange }) {
  const [prevSongId, setPrevSongId] = useState(null);

  // Track loading state when song changes
  useEffect(() => {
    if (!song || !song.item) {
      // No song data - notify parent we're loading
      if (onLoadingChange) onLoadingChange(true);
    } else {
      // If song ID changed, show loading briefly
      if (prevSongId !== song.item.id) {
        if (onLoadingChange) onLoadingChange(true);
        setPrevSongId(song.item.id);
        // Simulate loading time for smooth transition
        setTimeout(() => {
          if (onLoadingChange) onLoadingChange(false);
        }, 500);
      } else {
        if (onLoadingChange) onLoadingChange(false);
      }
    }
  }, [song, prevSongId, onLoadingChange]);

  // If no song, return null (parent will show loading overlay)
  if (!song || !song.item) return null;

  return (
    <div className="relative w-full max-w-[550px] mx-auto md:mx-0 md:ml-[2vw] flex flex-col items-center p-4 rounded-xl">
      <Image
        src={song.item.album.images[0].url}
        alt={`${song.item.name} Album cover`}
        width={500}
        height={400}
        className="rounded-xl"
      />
      <h2 className="text-white text-3xl mt-4 text-center">{song.item.name}</h2>
      <p className="text-gray-300 text-2xl mt-3">{song.item.artists[0].name}</p>
      <div className="mt-5 mb-5 flex gap-9">
        <Previous_Button size={18} thickness={5} refreshSong={getSong} accessToken={accessToken} />
        <PlayPauseToggle size={30} accessToken={accessToken} refreshSong={getSong} isPlaying={isPlaying} />
        <Next_Button size={18} thickness={5} refreshSong={getSong} accessToken={accessToken} />
      </div>
    </div>
  );
}