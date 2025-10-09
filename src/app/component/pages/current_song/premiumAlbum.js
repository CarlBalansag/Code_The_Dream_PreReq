"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function PremiumAlbum({ artistId, accessToken }) {
const [albums, setAlbums] = useState([]);
const [artistName, setArtistName] = useState("");
const [selectedAlbum, setSelectedAlbum] = useState(null);
const [albumTracks, setAlbumTracks] = useState([]);
const [loading, setLoading] = useState(false);

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

const fetchAlbumTracks = async (albumId) => {
    setLoading(true);
    try {
    const res = await fetch(
        `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`,
        {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        }
    );
    const data = await res.json();
    setAlbumTracks(data.items || []);
    }   catch (error) {
    console.error("Error fetching album tracks:", error);
    setAlbumTracks([]);
    }   finally {
    setLoading(false);
    }
};

const handleAlbumClick = async (album) => {
    setSelectedAlbum(album);
    await fetchAlbumTracks(album.id);
}

const closeModal = () => {
    setSelectedAlbum(null);
    setAlbumTracks([]);
}

const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, "0")}`;
};

if (!albums.length) return <p className="text-white">Loading albums...</p>;

return (
    <>
    <div
        className="p-4 rounded-md max-w-lg overflow-y-auto custom-scrollbar"
        style={{ maxHeight: "800px" }}
        >
            <h2 className="text-[#1DB954] text-xl font-semibold mb-3 text-center">
        Albums by {artistName}
        </h2>
        <ul className="space-y-3">
        {albums.map((album) => (
            <li
            key={album.id}
            onClick={() => handleAlbumClick(album)}
            className="flex items-center space-x-4 bg-[#212121] p-3 rounded-lg cursor-pointer hover:bg-[#2a2a2a] transition-colors"
            >
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

    {/* Modal */}
    {selectedAlbum && (
        <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
        onClick={closeModal}
        >
        <div
            className="bg-[#181818] rounded-lg max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Modal Header - Fixed */}
            <div className="flex items-start gap-4 p-6 border-b border-gray-800 flex-shrink-0">
            <Image
                src={selectedAlbum.images[0]?.url || ""}
                alt={selectedAlbum.name}
                width={128}
                height={128}
                className="rounded object-cover"
            />
            <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-2">
                {selectedAlbum.name}
                </h2>
                <p className="text-gray-400 mb-1">{artistName}</p>
                <p className="text-sm text-gray-500">
                {selectedAlbum.release_date} • {selectedAlbum.total_tracks} tracks
                </p>
            </div>
            <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white text-2xl font-bold flex-shrink-0"
            >
                ×
            </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="overflow-y-auto flex-1 p-6 custom-scrollbar">
            {loading ? (
                <p className="text-center text-gray-400">Loading tracks...</p>
            ) : (
                <div className="space-y-2">
                {albumTracks.map((track, index) => (
                    <div
                    key={track.id}
                    className="flex items-center gap-4 p-3 rounded hover:bg-[#212121] transition-colors"
                    >
                    <span className="text-gray-400 w-6 text-center flex-shrink-0">
                        {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                        {track.name}
                        </p>
                        <p className="text-sm text-gray-400 truncate">
                        {track.artists.map((a) => a.name).join(", ")}
                        </p>
                    </div>
                    <span className="text-gray-400 text-sm flex-shrink-0">
                        {formatDuration(track.duration_ms)}
                    </span>
                    </div>
                ))}
                </div>
            )}
            </div>
        </div>
        </div>
    )}
    </>
);
}