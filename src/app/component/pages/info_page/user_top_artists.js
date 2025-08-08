"use client";
import { useState, useEffect } from "react";

export default function UserTopArtists({ accessToken }) {
const [topArtists, setTopArtists] = useState([]);
const [timeRange, setTimeRange] = useState("short_term");

useEffect(() => {
    const fetchTopArtists = async () => {
    try {
        const res = await fetch(
        `https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!res.ok) return console.error("Error fetching top artists:", res.status);
        const data = await res.json();
        const formatted = data.items.map((artist) => ({
        id: artist.id,
        name: artist.name,
        image: artist.images[0]?.url || "",
        }));
        setTopArtists(formatted);
    } catch (err) {
        console.error("Error:", err);
    }
    };
    if (accessToken) fetchTopArtists();
}, [accessToken, timeRange]);

return (
    // Make the whole card a column; header OUTSIDE the scroll area
    <div className="w-full h-full min-h-0 rounded-xl bg-[#121212] flex flex-col">
    {/* Header (not inside overflow). No jump, always on top of this card */}
    <div className="z-10 px-4 pt-5 pb-4 text-center shadow-md">
        <p className="text-[#1DB954] text-xl font-semibold">Top Artists</p>
        <div className="flex justify-center gap-2 mt-3">
        {["short_term", "medium_term", "long_term"].map((range) => (
            <button
            key={range}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
                timeRange === range
                ? "bg-[#1DB954] text-white"
                : "bg-white hover:bg-gray-200 text-black"
            }`}
            onClick={() => setTimeRange(range)}
            >
            {range === "short_term" ? "4 Weeks" : range === "medium_term" ? "6 Months" : "12 Months"}
            </button>
        ))}
        </div>
    </div>

    {/* Scrollable content area */}
    <div className="custom-scrollbar flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        {topArtists.length > 0 ? (
        <ul className="space-y-4 mt-3">
            {topArtists.map((item, index) => (
            <li key={item.id} className="bg-[#212121] rounded-lg p-3 flex items-center gap-4">
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-md object-cover flex-none" />
                <div className="flex-grow min-w-0">
                <p className="text-white font-semibold text-md truncate">
                    {index + 1}. {item.name}
                </p>
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
