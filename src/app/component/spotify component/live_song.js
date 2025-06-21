	"use client";
	import Image from "next/image";
	import PlayPauseToggle from "./play_pause_button_playbackControls";
	import Next_Button from "./next_button_playbackControls";
	import Previous_Button from "./previous_button_playbackControls";

	// Fetches the currently playing track from Spotify API
	export async function fetchCurrentlyPlaying(accessToken) {
		try {
			const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
				headers: { Authorization: `Bearer ${accessToken}` },
			});

			if (res.status === 204) return null;  // 204 means no content (nothing is currently playing)

			if (!res.ok) {
				console.error("Error fetching currently playing:", res.status);
				return null;
			}

			return await res.json();  // Return the currently playing track data
		} catch (error) {
				console.error("Fetch error:", error);
				return null;
		}
	}

	// Displays album cover, song info, and playback controls
	export default function LiveSong({ song, isPlaying, accessToken, getSong }) {
	if (!song || !song.item) return null;

	return (
			<div className="relative w-full max-w-[550px] mx-auto md:mx-0 md:ml-[2vw] flex flex-col items-center p-4 rounded-xl">
				<Image
						src={song.item.album.images[0].url}
						alt={`${song.item.name} Album cover`}
						width={500}
						height={400}
						className="rounded-xl"
				/> {/* Displays the currently playing songs cover */}
				<h2 className="text-white text-3xl mt-4 text-center">{song.item.name}</h2> {/* Displays the currently playing songs name */}
				<p className="text-gray-300 text-2xl mt-3">{song.item.artists[0].name}</p> {/* Displays the currently playing songs artist */}
				<div className="mt-5 mb-5 flex gap-9">
						<Previous_Button size={18} thickness={5} refreshSong={getSong} accessToken={accessToken} /> 					{/* Function to play previous song */}
						<PlayPauseToggle size={30} accessToken={accessToken} refreshSong={getSong} isPlaying={isPlaying} />		{/* Function to play  or pause current song */}
						<Next_Button size={18} thickness={5} refreshSong={getSong} accessToken={accessToken} />								{/* Function to play next song */}
				</div>
			</div>
	);
	}
