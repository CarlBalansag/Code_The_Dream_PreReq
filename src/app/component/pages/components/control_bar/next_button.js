"use client";

export default function Next_Button({ size = 50, thickness = 8, accessToken, refreshSong }) {

    const playRecommendations = async (currentTrackId) => {
        try {
            console.log("Fetching track details for:", currentTrackId);

            // First, get the track details to get artist info
            const trackRes = await fetch(
                `https://api.spotify.com/v1/tracks/${currentTrackId}`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );

            if (!trackRes.ok) {
                console.error("Failed to fetch track details:", trackRes.status);
                return false;
            }

            const trackData = await trackRes.json();
            const artistId = trackData.artists[0].id;
            console.log("Artist ID:", artistId);

            // Get artist's top tracks
            const topTracksRes = await fetch(
                `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );

            if (!topTracksRes.ok) {
                console.error("Failed to fetch artist top tracks:", topTracksRes.status);
                return false;
            }

            const topTracksData = await topTracksRes.json();
            console.log("Found", topTracksData.tracks.length, "top tracks for artist");

            if (topTracksData.tracks && topTracksData.tracks.length > 0) {
                // Get active device
                const deviceRes = await fetch("https://api.spotify.com/v1/me/player/devices", {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });

                const deviceData = await deviceRes.json();
                const activeDevice = deviceData.devices.find((d) => d.is_active);

                if (!activeDevice) {
                    console.error("No active device found");
                    return false;
                }

                // Filter out the current track and get URIs
                const trackUris = topTracksData.tracks
                    .filter(track => track.id !== currentTrackId)
                    .map(track => track.uri);

                if (trackUris.length === 0) {
                    console.error("No different tracks found");
                    return false;
                }

                console.log("Playing", trackUris.length, "tracks from artist");

                const playRes = await fetch(
                    `https://api.spotify.com/v1/me/player/play?device_id=${activeDevice.id}`,
                    {
                        method: "PUT",
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ uris: trackUris }),
                    }
                );

                if (playRes.status === 204) {
                    console.log("Successfully playing artist's top tracks!");
                    if (refreshSong) {
                        setTimeout(() => {
                            refreshSong();
                        }, 600);
                    }
                    return true;
                } else {
                    console.error("Failed to start playback:", playRes.status);
                    const errorText = await playRes.text();
                    console.error("Error response:", errorText);
                }
            }
            return false;
        } catch (error) {
            console.error("Error playing recommendations:", error);
            return false;
        }
    };

    const handleClick = async () => {
        try {
            // Get currently playing BEFORE trying to skip (to have track ID for recommendations)
            const beforeRes = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            let currentTrackId = null;
            if (beforeRes.ok) {
                const beforeData = await beforeRes.json();
                if (beforeData && beforeData.item && beforeData.item.id) {
                    currentTrackId = beforeData.item.id;
                    console.log("Current track ID:", currentTrackId);
                }
            }

            // Try to skip to next track
            const res = await fetch("https://api.spotify.com/v1/me/player/next", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            console.log("Skip response status:", res.status);

            // Wait for skip to take effect, then check what's playing
            setTimeout(async () => {
                const afterRes = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });

                console.log("After skip status:", afterRes.status);

                // If nothing is playing after skip, the queue was empty
                if (afterRes.status === 204) {
                    console.log("No track playing after skip - queue is empty!");
                    if (currentTrackId) {
                        console.log("Playing recommendations based on:", currentTrackId);
                        await playRecommendations(currentTrackId);
                    } else {
                        console.error("Cannot play recommendations - no track ID available");
                    }
                } else if (afterRes.ok) {
                    const afterData = await afterRes.json();
                    // Check if we're still on the same track (skip didn't work)
                    if (afterData && afterData.item && afterData.item.id === currentTrackId) {
                        console.log("Still on same track after skip - queue is empty!");
                        console.log("Playing recommendations based on:", currentTrackId);
                        await playRecommendations(currentTrackId);
                    } else {
                        console.log("Successfully skipped to next track!");
                        if (refreshSong) {
                            refreshSong();
                        }
                    }
                }
            }, 800);
        } catch (error) {
            console.error("Error in handleClick:", error);
        }
    };

return (
    <div
    className="arrow"
    onClick={handleClick}
    style={{
        width: `${size}px`,
        height: `${size * 1.2}px`,
        marginTop: "2.9px",
    }}
    >
    <div
        className="arrow-top"
        style={{
        height: `${thickness}px`,
        }}
    ></div>
    <div
        className="arrow-bottom"
        style={{
        height: `${thickness}px`,
        }}
    ></div>

    <style jsx>{`
        .arrow {
        cursor: pointer;
        position: relative;
        transition: transform 0.1s;
        display: flex;
        justify-content: center;
        align-items: center;
        }

        .arrow-top,
        .arrow-bottom {
        background-color: #666;
        width: 100%;
        position: absolute;
        top: 50%;
        }

        .arrow-top:after,
        .arrow-bottom:after {
        content: "";
        background-color: #fff;
        height: 100%;
        position: absolute;
        top: 0;
        transition: all 0.15s;
        }

        .arrow-top {
        transform: rotate(45deg);
        transform-origin: bottom right;
        }

        .arrow-top:after {
        left: 100%;
        right: 0;
        transition-delay: 0s;
        }

        .arrow-bottom {
        transform: rotate(-45deg);
        transform-origin: top right;
        }

        .arrow-bottom:after {
        left: 0;
        right: 100%;
        transition-delay: 0.15s;
        }

        .arrow:hover .arrow-top:after {
        left: 0;
        transition-delay: 0.15s;
        }

        .arrow:hover .arrow-bottom:after {
        right: 0;
        transition-delay: 0s;
        }

        .arrow:active {
        transform: scale(0.9);
        }
    `}</style>
    </div>
);
}
