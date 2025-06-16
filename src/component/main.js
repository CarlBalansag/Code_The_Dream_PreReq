"use client";
import { useState, useEffect } from "react";
import LiveSong, { fetchCurrentlyPlaying } from "./spotify component/live_song";
import RecentlyPlayedList from "./spotify component/recently_played_list";
import PremiumTopTracks from "./spotify component/premiumTopTracks";
import PremiumAlbum from "./spotify component/premiumAlbum";
import UserTopTracks from "./spotify component/user_top_tracks";
import UserTopArtists from "./spotify component/user_top_artists";

export default function CurrentlyPlaying({ accessToken, premium, name }) {
const [song, setSong] = useState(null);
const [isPlaying, setIsPlaying] = useState(false);
const [songID, setSongID] = useState(null);

const getSong = async () => {
    if (!accessToken) return;

    const currentSong = await fetchCurrentlyPlaying(accessToken);

    if (currentSong && currentSong.item) {
    setIsPlaying(currentSong.is_playing);
    const newSongId = currentSong.item.id;

    if (songID !== newSongId) {
        setSongID(newSongId);
        setSong(currentSong);
    }
    } else {
    setSong(null);
    setIsPlaying(false);
    }
};

useEffect(() => {
    if (!accessToken) return;
    getSong();
    const interval = setInterval(() => getSong(), 3000);
    return () => clearInterval(interval);
}, [accessToken]);

return (
    <div>
    {premium ? (
        song && song.item ? (
        <div className="flex flex-col gap-8 md:flex-row">
            <div className="basis-1/3">
                <LiveSong song={song} isPlaying={isPlaying} accessToken={accessToken} getSong={getSong}/>
            </div>
            <div className="basis-1/3">
                <PremiumTopTracks artistId={song.item.artists[0].id} accessToken={accessToken}/>
            </div>
            <div className="basis-1/3">
                <PremiumAlbum artistId={song.item.artists[0].id} accessToken={accessToken}/>
            </div>
        </div>
        ) : (
        <div className="text-center">
            <div className="flex flex-row w-full">
            <div className="text-white p-4 text-center basis-1/3">
                <UserTopArtists accessToken={accessToken} />
            </div>
            <div className="basis-1/3">
                <UserTopTracks accessToken={accessToken} />
            </div>
            <div className="basis-1/3">
                <RecentlyPlayedList accessToken={accessToken} name={name} />
            </div>
            </div>
        </div>
        )
    ) : (
        <div className="text-center">
        <p className="text-red-500 text-xl font-semibold mb-4">
            Not a Premium Member
        </p>
        <div className="flex flex-row w-full">
            <div className="text-white p-4 text-center basis-1/3">
                <UserTopArtists accessToken={accessToken} />
            </div>
            <div className="basis-1/3">
                <UserTopTracks accessToken={accessToken} />
            </div>
            <div className="basis-1/3">
                <RecentlyPlayedList accessToken={accessToken} name={name} />
            </div>
        </div>
        </div>
    )}
    </div>
);
}
