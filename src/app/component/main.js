"use client";
import { useState, useEffect } from "react";
import LiveSong, { fetchCurrentlyPlaying } from "./spotify component/live_song";
import RecentlyPlayedList from "./spotify component/recently_played_list";
import PremiumTopTracks from "./spotify component/premiumTopTracks";
import PremiumAlbum from "./spotify component/premiumAlbum";
import UserTopTracks from "./spotify component/user_top_tracks";
import UserTopArtists from "./spotify component/user_top_artists";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import {
Navigation,
Pagination,
Mousewheel,
Keyboard,
} from "swiper/modules";

export default function CurrentlyPlaying({ accessToken, premium, name }) {
const [song, setSong] = useState(null);
const [isPlaying, setIsPlaying] = useState(false);
const [songID, setSongID] = useState(null);
const [activeIndex, setActiveIndex] = useState(0);

const swipeHints = [
    "Swipe right for Top Tracks",
    "Swipe right for Recently Played",
    "Swipe left to go back to Artists",
];

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
    <div className="absolute inset-0 overflow-hidden">
    {premium ? (
        song && song.item ? (
        <div className="flex flex-col gap-8 md:flex-row">
            <div className="basis-1/3">
            <LiveSong
                song={song}
                isPlaying={isPlaying}
                accessToken={accessToken}
                getSong={getSong}
            />
            </div>
            <div className="basis-1/3">
            <PremiumTopTracks
                artistId={song.item.artists[0].id}
                accessToken={accessToken}
            />
            </div>
            <div className="basis-1/3">
            <PremiumAlbum
                artistId={song.item.artists[0].id}
                accessToken={accessToken}
            />
            </div>
        </div>
        ) : (
        <div className="text-center w-full h-full">
            {/* Mobile View */}
            <div className="block lg:hidden flex justify-center px-4 relative overflow-visible w-full ">
            <div className="w-full max-w-[600px] relative overflow-visible">
                <div className="text-sm text-red-400 mb-2 text-center">
                {swipeHints[activeIndex]}
                </div>
                <Swiper
                cssMode={true}
                navigation={true}
                pagination={true}
                mousewheel={true}
                keyboard={true}
                modules={[Navigation, Pagination, Mousewheel, Keyboard]}
                className="mySwiper swiper-custom"
                onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
                >
                <SwiperSlide>
                    <div className="overflow-hidden p-4">
                    <UserTopArtists accessToken={accessToken} />
                    </div>
                </SwiperSlide>
                <SwiperSlide>
                    <div className="overflow-hidden p-4">
                    <UserTopTracks accessToken={accessToken} />
                    </div>
                </SwiperSlide>
                <SwiperSlide>
                    <div className="overflow-hidden p-4">
                    <RecentlyPlayedList accessToken={accessToken} name={name} />
                    </div>
                </SwiperSlide>
                </Swiper>
            </div>
            </div>

            {/* Desktop View */}
            <div className="hidden lg:flex flex-row w-full">
            <div className="text-white pl-7 text-center basis-1/3">
                <UserTopArtists accessToken={accessToken} />
            </div>
            <div className="pl-7 basis-1/3">
                <UserTopTracks accessToken={accessToken} />
            </div>
            <div className="pl-7 basis-1/3">
                <RecentlyPlayedList accessToken={accessToken} name={name} />
            </div>
            </div>
        </div>
        )
    ) : (
        <div className="text-center w-full h-full">
        <p className="text-red-500 text-xl font-semibold mb-4">
            Not a Premium Member
        </p>

        {/* Mobile View */}
        <div className="block lg:hidden flex justify-center px-4 overflow-hidden w-full">
            <div className="w-full max-w-md">
            <div className="text-sm text-red-400 mb-2 text-center">
                {swipeHints[activeIndex]}
            </div>
            <Swiper
                cssMode={true}
                navigation={true}
                pagination={true}
                mousewheel={true}
                keyboard={true}
                modules={[Navigation, Pagination, Mousewheel, Keyboard]}
                className="mySwiper swiper-custom"
                onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
            >
                <SwiperSlide>
                <div className="overflow-hidden p-4">
                    <UserTopArtists accessToken={accessToken} />
                </div>
                </SwiperSlide>
                <SwiperSlide>
                <div className="overflow-hidden p-4">
                    <UserTopTracks accessToken={accessToken} />
                </div>
                </SwiperSlide>
                <SwiperSlide>
                <div className="overflow-hidden p-4">
                    <RecentlyPlayedList accessToken={accessToken} name={name} />
                </div>
                </SwiperSlide>
            </Swiper>
            </div>
        </div>

        {/* Desktop View */}
        <div className="hidden lg:flex flex-row w-full">
            <div className="text-white pl-7 text-center basis-1/3">
            <UserTopArtists accessToken={accessToken} />
            </div>
            <div className="pl-7 basis-1/3">
            <UserTopTracks accessToken={accessToken} />
            </div>
            <div className="pl-7 basis-1/3">
            <RecentlyPlayedList accessToken={accessToken} name={name} />
            </div>
        </div>
        </div>
    )}
    </div>
);
}
