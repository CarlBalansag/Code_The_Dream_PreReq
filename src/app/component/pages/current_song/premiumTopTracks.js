"use client";
import { useEffect, useState, useRef } from "react";
import { Play, Pause } from "lucide-react";

export default function PremiumTopTracks({ artistId, accessToken, onLoadingChange }) {
    const [tracks, setTracks] = useState([]);
    const [artistName, setArtistName] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [hoveredTrackId, setHoveredTrackId] = useState(null);
    const [playingTrackId, setPlayingTrackId] = useState(null);
    const onLoadingChangeRef = useRef(onLoadingChange);
    const previousArtistIdRef = useRef(null);
    const isFetchingRef = useRef(false);

    // Keep ref up to date
    useEffect(() => {
        onLoadingChangeRef.current = onLoadingChange;
    }, [onLoadingChange]);

    useEffect(() => {
        // Prevent duplicate fetches
        if (!artistId || !accessToken || isFetchingRef.current) {
            return;
        }

        // Only fetch if artistId actually changed
        if (previousArtistIdRef.current === artistId) {
            return;
        }

        const fetchData = async () => {
            isFetchingRef.current = true;
            previousArtistIdRef.current = artistId;
            
            setIsLoading(true);
            // Notify parent that we're loading
            if (onLoadingChangeRef.current) onLoadingChangeRef.current(true);

            try {
                // Fetch top tracks
                const tracksRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });

                if (tracksRes.ok) {
                    const tracksData = await tracksRes.json();
                    const formattedTracks = tracksData.tracks.map((track) => ({
                        id: track.id,
                        name: track.name,
                        uri: track.uri,
                        artists: track.artists.map(artist => artist.name).join(", "),
                        image: track.album.images[0]?.url || "",
                    }));
                    setTracks(formattedTracks);
                } else {
                    console.error("Error fetching artist's top tracks:", tracksRes.status);
                }

                // Fetch artist name
                const artistRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });

                if (artistRes.ok) {
                    const artistData = await artistRes.json();
                    setArtistName(artistData.name);
                } else {
                    console.error("Error fetching artist name:", artistRes.status);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
                isFetchingRef.current = false;
                // Notify parent that we're done loading
                if (onLoadingChangeRef.current) onLoadingChangeRef.current(false);
            }
        };

        fetchData();
    }, [artistId, accessToken]);

    // Don't render anything while loading, parent will show skeleton
    if (isLoading) {
        return null;
    }

    if (!tracks || tracks.length === 0) {
        return <p className="text-white text-center p-4">No top tracks available.</p>;
    }

    const handlePlayTrack = async (trackUri, trackId) => {
        try {
            const deviceRes = await fetch("https://api.spotify.com/v1/me/player/devices", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            const deviceData = await deviceRes.json();
            const activeDevice = deviceData.devices.find((d) => d.is_active);

            if (!activeDevice) {
                alert("No active Spotify device found. Open Spotify on a device and try again.");
                return;
            }

            // If clicking on the currently playing track, pause it
            if (playingTrackId === trackId) {
                const pauseRes = await fetch(
                    `https://api.spotify.com/v1/me/player/pause`,
                    {
                        method: "PUT",
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                if (pauseRes.status === 204) {
                    setPlayingTrackId(null);
                    console.log("⏸️ Track paused");
                }
                return;
            }

            const playRes = await fetch(
                `https://api.spotify.com/v1/me/player/play?device_id=${activeDevice.id}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ uris: [trackUri] }),
                }
            );

            if (playRes.status === 204) {
                setPlayingTrackId(trackId);
                console.log("✅ Track started playing");
            } else {
                const errorText = await playRes.text();
                console.error("❌ Failed to play track. Response:", errorText);
            }
        } catch (error) {
            console.error("🔥 Exception during playback:", error);
        }
    };

    return (
        <div className="custom-scrollbar p-4 rounded-md overflow-y-auto w-full" style={{ maxHeight: "800px" }}>
            <p className="text-[#1DB954] text-xl font-semibold mb-2 text-center">
                Top Tracks for {artistName}
            </p>
            <ul className="space-y-3">
                {tracks.map((track, index) => (
                    <li
                        key={track.id}
                        className="bg-[#212121] hover:bg-[#2a2a2a] rounded-lg p-3 flex items-center space-x-4 cursor-pointer transition-colors group"
                        onMouseEnter={() => setHoveredTrackId(track.id)}
                        onMouseLeave={() => setHoveredTrackId(null)}
                        onClick={() => handlePlayTrack(track.uri, track.id)}
                    >
                        {/* Track number / Play/Pause icon */}
                        <div className="w-8 flex items-center justify-center text-gray-400 flex-shrink-0">
                            {playingTrackId === track.id ? (
                                <Pause size={20} className="text-[#1DB954] fill-[#1DB954]" />
                            ) : hoveredTrackId === track.id ? (
                                <Play size={20} className="text-[#1DB954] fill-[#1DB954]" />
                            ) : (
                                <span className="text-sm font-medium">{index + 1}</span>
                            )}
                        </div>

                        {/* Album cover */}
                        <img src={track.image} alt={track.name} className="w-16 h-16 rounded-md object-cover flex-shrink-0" />

                        {/* Track info */}
                        <div className="flex-grow min-w-0">
                            <p className="text-white font-medium truncate group-hover:text-[#1DB954] transition-colors">
                                {track.name}
                            </p>
                            <p className="text-sm text-gray-400 truncate">{track.artists}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}