import React from "react";
import "./quitButton.css";

export default function QuitButton({ setSong, setQuit, accessToken }) {
    const handleClick = async () => {
        try {
            // Pause playback on Spotify
            await fetch("https://api.spotify.com/v1/me/player/pause", {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            });
        } catch (error) {
            console.error("Failed to pause playback:", error);
        }

        // Then clear song and trigger re-render
        setSong(null);
        setQuit(prev => !prev);
    };

    return (
    <button className="bubble-button" onClick={handleClick}>
        Back to Info page
    </button>
    );
}
