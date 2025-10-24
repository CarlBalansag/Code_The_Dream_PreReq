import React from "react";
import "./quitButton.css";

export default function QuitButton({ setSong, setQuit, accessToken, setShowInfoPage }) {
    const handleClick = async () => {
        try {
        await fetch("https://api.spotify.com/v1/me/player/pause", {
            method: "PUT",
            headers: {
            Authorization: `Bearer ${accessToken}`,
            },
        });
        } catch (error) {
        console.error("Failed to pause playback:", error);
        }

        setShowInfoPage(true); // ✅ Lock into Info Page
        setSong(null);
        setQuit((prev) => !prev); // Re-fetch if needed
    };

    return (
        <button className="bubble-button" onClick={handleClick}>
        Back to Info page
        </button>
    );
}



