"use client";
import { useState, useEffect } from "react";
import Image from 'next/image';
import PlayPauseToggle from "./play_pause_button";
import Previous_Button from "./previous_button";
import Next_Button from "./next_button";

export default function CurrentlyPlaying({ accessToken, premium }) {
const [song, setSong] = useState(null);                                                                 
const [fade, setFade] = useState(false);
const [topTracks, setTopTracks] = useState([]);

const fetchCurrentlyPlaying = async (accessToken) => {                                                  
    try {
    const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {                
        method: 'GET',
        headers: {
        Authorization: `Bearer ${accessToken}`,
        },
    });

    if (res.status === 204) {                                                                           
        console.log('No song currently playing (paused)');
        return null;
    }

    if (!res.ok) {                                                                                    
        console.error('Error fetching currently playing:', res.status);
        return null;
    }

    const data = await res.json();                                                                      
    return data;
    } catch (error) {
    console.error('❌ Fetch error:', error);
    return null;
    }
};

const fetchTopTracks = async (accessToken) => {
    try {
    const res = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=5', {
        method: 'GET',
        headers: {
        Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!res.ok) {
        console.error('Error fetching top tracks:', res.status);
        return null;
    }

    const data = await res.json();

    const simplified = data.items.map(track => ({
        name: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        id: track.id,
        preview_url: track.preview_url,
    }));

    return simplified;
    } catch (error) {
    console.error('Fetch error:', error);
    return null;
    }
};

const getSong = async () => {
    if (!accessToken) return;

    const currentSong = await fetchCurrentlyPlaying(accessToken);

    if (currentSong) {
    if (!song || song?.item?.id !== currentSong.item.id) {
        setFade(true);
        setSong(currentSong);
        setTimeout(() => setFade(false), 300);
    } else {
        setSong(currentSong);
    }
    setTopTracks([]);
    } else {
    const top = await fetchTopTracks(accessToken);
    setSong(null);
    if (top) setTopTracks(top);
    }
};


useEffect(() => {                                                                                       
    if (!accessToken) return;                                                                           
    getSong();                                                                                          

    const interval = setInterval(() => {                                                                
        getSong();
    }, 15000); // 15 seconds

    return () => clearInterval(interval);                                                               
}, [accessToken]);

return (
<div className="relative w-full max-w-[450px] mx-auto md:mx-0 md:ml-[2vw]">
    {song && song.item ? (
    // 🎵 Currently playing section
    <div className={`flex flex-col items-center p-4 rounded-xl transition-opacity duration-300 ${fade ? "opacity-0" : "opacity-100"}`} id="current_music">
        <Image
        src={song.item.album.images[0].url}
        alt={`${song.item.name} Album cover`}
        width={500}
        height={400}
        className="rounded-xl"
        />
        <h2 className="text-white text-3xl mt-4 text-center">{song.item.name}</h2>
        <p className="text-gray-300 text-2xl mt-3">{song.item.artists[0].name}</p>

        {premium ? (
        <div className="mt-5 mb-5 flex gap-9" id="control">
            <Previous_Button size={18} thickness={5} refreshSong={getSong} accessToken={accessToken} />
            <PlayPauseToggle size={30} accessToken={accessToken} refreshSong={getSong} />
            <Next_Button size={18} thickness={5} refreshSong={getSong} accessToken={accessToken} />
        </div>
        ) : (
        <div className="relative mt-5 mb-5" id="control-wrapper">
            <div className="absolute inset-0 flex items-center justify-center z-10">
            <p className="text-red-700 text-xl font-semibold">Premium Only</p>
            </div>
                <div className="flex gap-12 opacity-50 pointer-events-none blur-sm" id="control">
                <Previous_Button size={6} thickness={5} refreshSong={getSong} accessToken={accessToken} />
                <PlayPauseToggle size={30} accessToken={accessToken} refreshSong={getSong} />
                <Next_Button size={15} thickness={5} refreshSong={getSong} accessToken={accessToken} />
            </div>
        </div>
        )}
    </div>
    ) : (
    // 🚫 No song currently playing + show top tracks
    <div className="text-white p-4 text-center">
        {topTracks.length > 0 && (
        <>
            <h2 className="text-2xl font-semibold mb-3">Your Top Tracks</h2>
            <ul className="space-y-3 w-full">
            {topTracks.map((track, i) => (
                <li key={track.id} className="bg-[#1f1f1f] rounded-lg p-3">
                <p className="text-lg font-medium">{i + 1}. {track.name}</p>
                <p className="text-sm text-gray-400">{track.artist}</p>
                </li>
            ))}
            </ul>
        </>
        )}
    </div>
    )}
</div>
);

}
