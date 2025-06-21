"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

// Displays a list of recently played tracks for the logged-in Spotify user
export default function RecentlyPlayedList({ accessToken, name }) {
const [recentTracks, setRecentTracks] = useState([]);   // Holds the user's recently played songs

useEffect(() => {   // Fetch recently played tracks from Spotify API
    const fetchRecentlyPlayed = async () => {
    try {
        const res = await fetch(
        `https://api.spotify.com/v1/me/player/recently-played?limit=30`,
        {
            headers: { Authorization: `Bearer ${accessToken}` },
        }
        );

        if (!res.ok) {
        console.error(`Error fetching recently played: ${res.status}`);
        return;
        }

        const data = await res.json();

        // Format the track data to simplify rendering
        const formatted = data.items.map(({ track }) => ({
        name: track.name,
        id: track.id,
        image: track.album?.images[0]?.url || "",
        artists: track.artists.map((a) => a.name).join(", "),
        }));

        setRecentTracks(formatted); // Save to state
    } catch (error) {
        console.error("Fetch error:", error);
    }
    };

    if (accessToken) fetchRecentlyPlayed(); // Only fetch if accessToken is available
}, [accessToken]);

return (
    <div id="recently_played_list" className="custom-scrollbar p-4 ml-6 rounded-md overflow-y-auto w-full max-w-lg" style={{ maxHeight: "800px" }} >
        <div className="sticky top-[-19px] z-10 bg-[#121212] pb-4">
            <p className="text-[#1DB954] text-xl font-semibold mb-2 text-center">
                Recently Played For {name}
            </p>
        </div>

        {recentTracks.length > 0 ? (
            <ul className="space-y-4">
            {recentTracks.map((item, index) => (
                <li key={item.id + index} className="bg-[#212121] rounded-lg p-3 flex items-center space-x-4">
                    <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 rounded-md object-cover"
                    />
                    <div className="flex items-center w-full">
                        <div className="flex-grow">
                            <p className="text-white font-semibold text-md"> {index + 1}. {item.name} </p>
                            <p className="text-gray-400 text-sm">By {item.artists}</p>
                        </div>
                    </div>
                </li>
            ))}
            </ul>
        ) : (
            <p className="text-white">No data available.</p>
        )}
    </div>
);
}
