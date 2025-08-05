"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function PremiumAlbum({ artistId, accessToken }) {
const [albums, setAlbums] = useState([]);
const [artistName, setArtistName] = useState("");

useEffect(() => {
    if (!artistId || !accessToken) return;

    const fetchArtistAlbums = async () => {
    try {
        const res = await fetch(
        `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album&market=US&limit=20`,
        {
            headers: {
            Authorization: `Bearer ${accessToken}`,
            },
        }
        );

        if (!res.ok) {
        console.error("Error fetching albums:", res.status);
        return;
        }

        const data = await res.json();

        const unique = [];
        const seen = new Set();
        for (const album of data.items) {
        if (!seen.has(album.name)) {
            unique.push(album);
            seen.add(album.name);
        }
        }

        setAlbums(unique);
    } catch (err) {
        console.error("Error fetching artist albums:", err);
    }
    };

    const fetchArtistName = async () => {
    try {
        const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        });

        if (!res.ok) return;

        const data = await res.json();
        setArtistName(data.name);
    } catch (err) {
        console.error("Error fetching artist name:", err);
    }
    };

    fetchArtistAlbums();
    fetchArtistName();
}, [artistId, accessToken]);

if (!albums.length) return <p className="text-white">Loading albums...</p>;

return (
    <div
    className="p-4 bg-[#181818] rounded-md max-w-lg overflow-y-auto custom-scrollbar"
    style={{ maxHeight: "800px" }}
    >
    <h2 className="text-[#1DB954] text-xl font-semibold mb-3 text-center">
        Albums by {artistName}
    </h2>
    <ul className="space-y-3">
        {albums.map((album) => (
        <li key={album.id} className="flex items-center space-x-4 bg-[#212121] p-3 rounded-lg">
            <Image
            src={album.images[0]?.url || ""}
            alt={album.name}
            width={64}
            height={64}
            className="rounded-md object-cover"
            />
            <div className="w-full">
            <p className="text-white font-medium text-center">{album.name}</p>
            <p className="text-sm text-gray-400 text-center">{album.release_date}</p>
            </div>
        </li>
        ))}
    </ul>
    </div>
);
}
