"use client";
import { useEffect, useState } from "react";
import CirclePlayButton from "../circle_play_button";

export default function PremiumTopTracks({ artistId, accessToken }) {
const [tracks, setTracks] = useState([]);
const [artistName, setArtistName] = useState("");

useEffect(() => {
    const fetchArtistTopTracks = async () => {
    try {
        const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
        console.error("Error fetching artist's top tracks:", res.status);
        return;
        }

        const data = await res.json();
        const formattedTracks = data.tracks.map((track) => ({
        id: track.id,
        name: track.name,
        album: track.album.name,
        image: track.album.images[0]?.url || "",
        preview_url: track.preview_url,
        }));

        setTracks(formattedTracks);
    } catch (error) {
        console.error("Error fetching artist top tracks:", error);
    }
    };

    const fetchArtistName = async () => {
    try {
        const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
        console.error("Error fetching artist name:", res.status);
        return;
        }

        const data = await res.json();
        setArtistName(data.name);
    } catch (error) {
        console.error("Error fetching artist info:", error);
    }
    };

    if (artistId && accessToken) {
    fetchArtistTopTracks();
    fetchArtistName();
    }
}, [artistId, accessToken]);

if (!tracks || tracks.length === 0) {
    return <p className="text-white">No recommendations available.</p>;
}

return (
    <div className="custom-scrollbar p-4 rounded-md overflow-y-auto w-full max-w-lg" style={{ maxHeight: "800px" }}>
    <p className="text-[#1DB954] text-xl font-semibold mb-2 text-center">
        Top Tracks for {artistName}
    </p>
    <ul className="space-y-4">
        {tracks.map((track, index) => (
        <li key={track.id} className="bg-[#212121] rounded-lg p-3 flex items-center space-x-4">
            <img src={track.image} alt={track.name} className="w-16 h-16 rounded-md object-cover" />
            <div className="flex items-center w-full">
            <div className="flex-grow">
                <p className="text-white font-semibold text-md">{index + 1}. {track.name}</p>
                <p className="text-sm text-gray-400">{track.album}</p>
            </div>
            <div className="ml-auto">
                {/* <CirclePlayButton /> */}
            </div>
            </div>
        </li>
        ))}
    </ul>
    </div>
);
}
