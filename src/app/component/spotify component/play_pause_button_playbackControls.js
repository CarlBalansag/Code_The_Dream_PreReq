"use client";
import { useState, useEffect } from "react";

// Toggle button to play or pause Spotify playback
export default function PlayPauseToggle({ size = 45, accessToken, refreshSong, isPlaying }) {

const [localPlaying, setLocalPlaying] = useState(isPlaying);

// Keep local state in sync when parent updates `isPlaying`
useEffect(() => {
    setLocalPlaying(isPlaying);
}, [isPlaying]);

// Toggle play/pause state by calling Spotify's API
const togglePlayPause = async () => {
    try {
    if (!accessToken) {
        console.error("No access token available");
        return;
    }

    // Choose the correct Spotify endpoint: "pause" or "play"
    const endpoint = localPlaying ? "pause" : "play";

    // Send PUT request to Spotify Web API to control playback
    await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}` },
    }); {/* Uses put instead of post because it is already a known state Post is used for performing a new action */}

    // Update local state and refresh current song info
    setLocalPlaying(!localPlaying);
    await refreshSong();
    } catch (error) {
    console.error("Error toggling playback:", error);
    }
};

return (
    <label
        className="relative flex items-center justify-center cursor-pointer"
        style={{ fontSize: `${size}px` }}
    >
        <input type="checkbox" checked={localPlaying} onChange={togglePlayPause} className="hidden" />

        {!localPlaying ? (
            <svg className="fill-white" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 384 512">
            <path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z" />
            </svg>
        ) : (
            <svg className="fill-white" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 320 512">
            <path d="M48 64C21.5 64 0 85.5 0 112V400c0 26.5 21.5 48 48 48H80c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H48zm192 0c-26.5 0-48 21.5-48 48V400c0 26.5 21.5 48 48 48h32c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H240z" />
            </svg>
        )}
    </label>
);
}
