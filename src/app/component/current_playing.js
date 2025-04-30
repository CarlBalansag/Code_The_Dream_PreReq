"use client";
import { useState, useEffect } from "react";
import Image from 'next/image';
// import PlayPauseToggle from "./play_pause_button";
// import Next_Button from "./next_button";
// import Previous_Button from "./previous_button";

export default function CurrentlyPlaying({ accessToken, premium }) {
const [song, setSong] = useState(null);                                                                 
const [fade, setFade] = useState(false);

const fetchCurrentlyPlaying = async (accessToken) => {                                                  
    try {
    const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {                
        method: 'GET',
        headers: {
        Authorization: `Bearer ${accessToken}`,
        },
    });

    if (res.status === 204) {                                                                           
        console.log('⏸️ No song currently playing (paused)');
        return null;
    }

    if (!res.ok) {                                                                                    
        console.error('❌ Error fetching currently playing:', res.status);
        return null;
    }

    const data = await res.json();                                                                      
    return data;
    } catch (error) {
    console.error('❌ Fetch error:', error);
    return null;
    }
};

const getSong = async () => {
    if (!accessToken) return;

    const currentSong = await fetchCurrentlyPlaying(accessToken);

    if (!currentSong) return;

    // 🔥 Only fade if the song is different
    if (!song || (song?.item?.id !== currentSong.item.id)) {
        console.log(song)
        setFade(true);
        setSong(currentSong);
        setTimeout(() => setFade(false), 300);
    } else {
    // 🔥 If same song, just update without fade
    setSong(currentSong);
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
<div className="relative w-full max-w-[350px] mx-auto md:mx-0 md:ml-[2vw]">
    {song && song.item ? (
        <div className={`flex flex-col items-center p-4 rounded-xl transition-opacity duration-300 ${fade ? "opacity-0" : "opacity-100"}`} id="current_music">
            <Image
                src={song.item.album.images[0].url}
                alt={`${song.item.name} Album cover`}
                width={300}
                height={300}
                className="rounded-xl"
            />
            <h2 className="text-white text-2xl mt-4">{song.item.name}</h2>
            <p className="text-gray-300">{song.item.artists[0].name}</p>

            {premium 
            ? (
                <div className="mt-5 mb-5 flex gap-9" id="control">
                    {/* <Previous_Button size={18} thickness={5} refreshSong={getSong} />
                    <PlayPauseToggle size={30} accessToken={accessToken} refreshSong={getSong} />
                    <Next_Button size={18} thickness={5} refreshSong={getSong} /> */}
                </div>
            ) : (
                <div className="relative mt-5 mb-5" id="control-wrapper">
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <p className="text-red-700 text-xl font-semibold">Premium Only</p>
                    </div>
                    <div className="flex gap-12 opacity-50 pointer-events-none blur-sm" id="control">
                        {/* <Previous_Button size={6} thickness={5} refreshSong={getSong} />
                        <PlayPauseToggle size={30} accessToken={accessToken} refreshSong={getSong} />
                        <Next_Button size={15} thickness={5} refreshSong={getSong} /> */}
                    </div>
                </div>
            )}
        </div>
    ) : (
        <p className="text-white text-center">No song currently playing</p>
    )}
</div>
);
}
