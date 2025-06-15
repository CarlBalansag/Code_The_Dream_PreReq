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
        {
            headers: { Authorization: `Bearer ${accessToken}` },
        }
        );

        if (!res.ok) {
        console.error("Error fetching top artists:", res.status);
        return;
        }

        const data = await res.json();
        const formatted = data.items.map((artist) => ({
        id: artist.id,
        name: artist.name,
        image: artist.images[0]?.url || "",
        }));

        setTopArtists(formatted);
    } catch (error) {
        console.error("Error:", error);
    }
    };

    if (accessToken) fetchTopArtists();
}, [accessToken, timeRange]);

return (
    <div className="custom-scrollbar p-4 ml-6 rounded-md overflow-y-auto w-full max-w-lg" style={{ maxHeight: "800px" }}>
    <div className="sticky top-[-19px] z-10 bg-[#121212] pb-4 text-center">
        <p className="text-[#1DB954] text-xl font-semibold mb-2">Top Artists</p>
        <div className="flex justify-center gap-2 mb-2">
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
            {range === "short_term"
                ? "4 Weeks"
                : range === "medium_term"
                ? "6 Months"
                : "12 Months"}
            </button>
        ))}
        </div>
    </div>

    {topArtists.length > 0 ? (
        <ul className="space-y-4">
        {topArtists.map((item, index) => (
            <li key={item.id} className="bg-[#212121] rounded-lg p-3 flex items-center space-x-4">
            <img src={item.image} alt={item.name} className="w-16 h-16 rounded-md object-cover" />
            <div className="flex-grow">
                <p className="text-white font-semibold text-md">{index + 1}. {item.name}</p>
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
