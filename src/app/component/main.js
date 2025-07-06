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
import { Pagination, Mousewheel, Keyboard,} from "swiper/modules";

export default function CurrentlyPlaying({ accessToken, premium, name }) {
const [song, setSong] = useState(null);                     //data of currently playing song
const [isPlaying, setIsPlaying] = useState(false);          //Checks if a song is currently playing
const [songID, setSongID] = useState(null);                 //gets the songs ID
const [activeIndex, setActiveIndex] = useState(0);
const [swiperRef, setSwiperRef] = useState(null);

const swipeHints = [
    "Swipe right for Top Tracks",
    "Swipe right for Recently Played",
    "Swipe left to go back to Artists",
];

const getSong = async () => {
    //exits function if there is no accessToken
    if (!accessToken) return;

    //gets the current playing song from the function fetchCurrentlyPlaying
    const currentSong = await fetchCurrentlyPlaying(accessToken);

    if (currentSong && currentSong.item) {      //if there is a song that is currently playing and there is song data
    setIsPlaying(currentSong.is_playing);       //update playback status
    const newSongId = currentSong.item.id;      // Get the ID of the currently playing song

    if (songID !== newSongId) {                 //if the useState songID is different from the current song playing 
        setSongID(newSongId);                   // Update the store SongID
        setSong(currentSong);                   // Save the full song object to state
    }
    } else {
    setSong(null);
    setIsPlaying(false);
    }
};

useEffect(() => {                                               //If there is no access token don't continue
    if (!accessToken) return;
    getSong();                                                  //Gets the currently playing song 
    const interval = setInterval(() => getSong(), 3000);        // Set up an interval to fetch the song every 3 seconds
    return () => clearInterval(interval);                       //Clean up the interval when component unmounts or accessToken changes 
}, [accessToken]);

const MobileNavigation = () => (
    <>
    {/* Left Arrow */}
    <button
        onClick={() => swiperRef?.slidePrev()}
        className="absolute top-1/2 left-0 transform -translate-y-1/2 z-50 text-[3.5rem] font-bold text-[#1DB954] lg:hidden"
    >
        ‹
    </button>

    {/* Right Arrow */}
    <button
        onClick={() => swiperRef?.slideNext()}
        className="absolute top-1/2 right-0 transform -translate-y-1/2 z-50 text-[3.5rem] font-bold text-[#1DB954] lg:hidden"
    >
        ›
    </button>
    </>
);

const MobileSwiper = () => (
    <div className="block lg:hidden flex justify-center px-4 relative overflow-visible w-full pb-14">
    <div className="w-full max-w-[600px] relative overflow-visible pr-10">
        <MobileNavigation />
        <div className="text-sm text-red-400 mb-2 text-center">
        {swipeHints[activeIndex]}
        </div>
        <Swiper
        cssMode={true}
        navigation={false}
        pagination={false}
        mousewheel={true}
        keyboard={true}
        onSwiper={setSwiperRef}
        onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
        modules={[Pagination, Mousewheel, Keyboard]}
        className="mySwiper"
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
);

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
            {MobileSwiper()}
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
        {MobileSwiper()}
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