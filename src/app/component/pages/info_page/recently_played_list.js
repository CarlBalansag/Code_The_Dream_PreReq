// recently_played_list.js
"use client";
import { useState, useEffect } from "react";

export default function RecentlyPlayedList({ accessToken, name }) {
const [recentTracks, setRecentTracks] = useState([]);

useEffect(() => {
    const fetchRecentlyPlayed = async () => {
    try {
        const res = await fetch(
        `https://api.spotify.com/v1/me/player/recently-played?limit=30`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!res.ok) {
        console.error(`Error fetching recently played: ${res.status}`);
        return;
        }
        const data = await res.json();
        const formatted = data.items.map(({ track }) => ({
        name: track.name,
        id: track.id,
        image: track.album?.images[0]?.url || "",
        artists: track.artists.map((a) => a.name).join(", "),
        }));
        setRecentTracks(formatted);
    } catch (error) {
        console.error("Fetch error:", error);
    }
    };
    if (accessToken) fetchRecentlyPlayed();
}, [accessToken]);

return (
    <div className="w-full h-full min-h-0 rounded-xl bg-[#121212] flex flex-col">
    {/* Header (fixed within card, not in scroll) */}
    <div className="z-10 px-4 pt-5 pb-4 text-center shadow-md">
        <p className="text-[#1DB954] text-xl font-semibold">
        Recently Played For {name}
        </p>
    </div>

    {/* Scrollable list */}
    <div className="custom-scrollbar flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        {recentTracks.length > 0 ? (
        <ul className="space-y-4 mt-3">
            {recentTracks.map((item, index) => (
            <li
                key={item.id + index}
                className="bg-[#212121] rounded-lg p-3 flex items-center gap-4"
            >
                <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 rounded-md object-cover flex-none"
                />
                <div className="flex-grow min-w-0">
                <p className="text-white font-semibold text-md truncate">
                    {index + 1}. {item.name}
                </p>
                <p className="text-gray-400 text-sm truncate">By {item.artists}</p>
                </div>
            </li>
            ))}
        </ul>
        ) : (
        <p className="text-white">No data available.</p>
        )}
    </div>
    </div>
);
}
