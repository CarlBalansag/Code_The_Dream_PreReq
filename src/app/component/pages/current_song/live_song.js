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

    // Handle rate limiting
    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After');
      console.warn(`⚠️ Rate limited. Retry after ${retryAfter || '60'} seconds`);
      return null; // Return null instead of erroring out
    }

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
  // Notify parent we're done loading as soon as we have song data
  useEffect(() => {
    if (song && song.item && onLoadingChange) {
      onLoadingChange(false);
    }
  }, [song, onLoadingChange]);

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
      <p className="text-gray-200 text-2xl mt-3">{song.item.artists[0].name}</p>
      <div className="mt-5 mb-5 flex gap-9">
        <Previous_Button size={18} thickness={5} refreshSong={getSong} accessToken={accessToken} />
        <PlayPauseToggle size={30} accessToken={accessToken} refreshSong={getSong} isPlaying={isPlaying} />
        <Next_Button size={18} thickness={5} refreshSong={getSong} accessToken={accessToken} />
      </div>
    </div>
  );
}