"use client";
<<<<<<< HEAD
import { useState, useEffect } from "react";
import LiveSong from "./component/pages/current_song/live_song";
import RecentlyPlayedList from "./component/pages/info_page/recently_played_list";
import PremiumTopTracks from "./component/pages/current_song/premiumTopTracks";
import PremiumAlbum from "./component/pages/current_song/premiumAlbum";
import UserTopArtists from "./component/pages/info_page/user_top_artists";
import UserTopTracks from "./component/pages/info_page/user_top_tracks";
import FloatingActionButton from "./component/pages/info_page/floating_action";
import { fetchCurrentlyPlaying } from "./component/pages/current_song/live_song";
import QuitButton from "./component/pages/current_song/quit_song";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Pagination, Mousewheel, Keyboard } from "swiper/modules";

export default function CurrentlyPlaying({ accessToken, premium, name, deviceConnected }) {
  const [song, setSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [songID, setSongID] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [swiperRef, setSwiperRef] = useState(null);
  const [quit, setQuit] = useState(false);
  const [showInfoPage, setShowInfoPage] = useState(false);

  const swipeHintsInfoPage = [
    "Swipe right for Top Tracks",
    "Swipe right for Recently Played Music",
    "Swipe left to go back to Top Tracks",
  ];

  const swipeHintsLiveSong = [
    "Swipe right for Top Tracks",
    "Swipe right for Albums",
    "Swipe left to go back to Song",
  ];

  const getSong = async () => {
    if (!accessToken) return;
    const currentSong = await fetchCurrentlyPlaying(accessToken);
    if (currentSong && currentSong.item) {
      setIsPlaying(currentSong.is_playing);
      setSongID(currentSong.item.id);
      setSong(currentSong);
    } else {
      setIsPlaying(false);
      setSong(null);
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    getSong();
    const interval = setInterval(() => getSong(), 3000);
    return () => clearInterval(interval);
  }, [accessToken, quit]);

  const MobileNavigation = () => (
    <>
      <button
        onClick={() => swiperRef?.slidePrev()}
        className="absolute top-1/2 left-0 -translate-y-1/2 z-50 text-[3.5rem] font-bold text-[#1DB954] lg:hidden"
        aria-label="Previous"
      >
        ‹
      </button>
      <button
        onClick={() => swiperRef?.slideNext()}
        className="absolute top-1/2 right-0 -translate-y-1/2 z-50 text-[3.5rem] font-bold text-[#1DB954] lg:hidden"
        aria-label="Next"
      >
        ›
      </button>
    </>
  );

  const MobileSwiper = () => (
    <div className="block lg:hidden w-full px-4 pb-16 relative">
      <div className="w-full max-w-[640px] mx-auto relative">
        <MobileNavigation />
        <div className="text-sm text-red-400 mb-2 text-center">
          {swipeHintsInfoPage[activeIndex]}
        </div>
        {/* IMPORTANT: give Swiper explicit height on mobile */}
        <Swiper
          slidesPerView={1}
          onSwiper={setSwiperRef}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          modules={[Pagination, Mousewheel, Keyboard]}
          className="mySwiper h-[70vh]"
        >
          <SwiperSlide>
            <div className="p-2 h-full overflow-y-auto">
              <UserTopArtists accessToken={accessToken} />
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="p-2 h-full overflow-y-auto">
              <UserTopTracks accessToken={accessToken} setShowInfoPage={setShowInfoPage} />
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="p-2 h-full overflow-y-auto">
              <RecentlyPlayedList accessToken={accessToken} name={name} />
            </div>
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
  );

  const MobileNowPlayingSwiper = () => (
    <div className="block lg:hidden w-full px-4 pb-16 relative">
      <div className="w-full max-w-[640px] mx-auto relative">
        <MobileNavigation />
        <div className="text-sm text-red-400 mb-2 text-center">
          {swipeHintsLiveSong[activeIndex]}
        </div>
        {/* IMPORTANT: explicit height so slides render */}
        <Swiper
          slidesPerView={1}
          onSwiper={setSwiperRef}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          modules={[Pagination, Mousewheel, Keyboard]}
          className="mySwiper h-[80vh]"
        >
          <SwiperSlide>
            <div className="p-2 h-full overflow-hidden">
              <LiveSong song={song} isPlaying={isPlaying} accessToken={accessToken} getSong={getSong} />
              <div className="mt-2 flex justify-center">
                <QuitButton setSong={setSong} setQuit={setQuit} accessToken={accessToken} setShowInfoPage={setShowInfoPage} />
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="p-2 h-full overflow-hidden">
              <PremiumTopTracks artistId={song.item.artists[0].id} accessToken={accessToken} />
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="p-2 h-full overflow-hidden">
              <PremiumAlbum artistId={song.item.artists[0].id} accessToken={accessToken} />
            </div>
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* layout shell */}
      <div className="h-full w-full mx-auto px-[5%] xl:px-6 flex flex-col">
        {/* CONTENT AREA */}
        <div className="flex-1 min-h-0">
          {premium ? (
            !deviceConnected && !showInfoPage && song && song.item ? (
              <>
                {MobileNowPlayingSwiper()}
                {/* Desktop / Large screens - FIXED LAYOUT */}
                <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-12 gap-6 h-full min-h-0">
                  {/* First column - Live Song */}
                  <div className="lg:col-span-1 xl:col-span-4 h-full min-h-0">
                    <div className="h-full min-h-0 overflow-hidden rounded-xl">
                      <div className="p-4">
                        <LiveSong song={song} isPlaying={isPlaying} accessToken={accessToken} getSong={getSong} />
                        <div className="mt-5 pl-18 text-center">
                          <QuitButton setSong={setSong} setQuit={setQuit} accessToken={accessToken} setShowInfoPage={setShowInfoPage} />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Second column - Premium Top Tracks */}
                  <div className="lg:col-span-1 xl:col-span-4 h-full min-h-0">
                    <div className="h-full min-h-0 rounded-xl">
                      {/* REMOVED overflow-y-auto from wrapper to prevent double scrollbars */}
                      <div className="p-4 h-full">
                        <PremiumTopTracks artistId={song.item.artists[0].id} accessToken={accessToken} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Third column - Premium Album */}
                  <div className="lg:col-span-1 xl:col-span-4 h-full min-h-0">
                    <div className="h-full min-h-0 rounded-xl">
                      {/* REMOVED overflow-y-auto from wrapper to prevent double scrollbars */}
                      <div className="p-4 h-full">
                        <PremiumAlbum artistId={song.item.artists[0].id} accessToken={accessToken} />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full">
                {MobileSwiper()}
                {/* Desktop / Large screens - Info Page Layout */}
                <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-12 gap-6 h-[calc(100%-4rem)] min-h-0">
                  <div className="lg:col-span-1 xl:col-span-4 h-full min-h-0">
                    <div className="h-full min-h-0 overflow-hidden rounded-xl">
                      <UserTopArtists accessToken={accessToken} />
                    </div>
                  </div>
                  <div className="lg:col-span-1 xl:col-span-4 h-full min-h-0">
                    <div className="h-full min-h-0 overflow-hidden rounded-xl">
                      <UserTopTracks accessToken={accessToken} setShowInfoPage={setShowInfoPage} />
                    </div>
                  </div>
                  <div className="lg:col-span-1 xl:col-span-4 h-full min-h-0">
                    <div className="h-full min-h-0 overflow-hidden rounded-xl">
                      <RecentlyPlayedList accessToken={accessToken} name={name} />
                    </div>
                  </div>
                </div>
                <FloatingActionButton />
              </div>
            )
          ) : (
            <div className="w-full h-full">
              <p className="text-red-500 text-xl font-semibold mb-4">Not a Premium Member</p>
              {MobileSwiper()}
              <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-12 gap-6 h-[calc(100%-4rem)] min-h-0">
                <div className="lg:col-span-1 xl:col-span-4 h-full min-h-0">
                  <UserTopArtists accessToken={accessToken} />
                </div>
                <div className="lg:col-span-1 xl:col-span-4 h-full min-h-0">
                  <UserTopTracks accessToken={accessToken} />
                </div>
                <div className="lg:col-span-1 xl:col-span-4 h-full min-h-0">
                  <RecentlyPlayedList accessToken={accessToken} name={name} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
=======
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
// import UserTopTracks from "./component/pages/info_page/user_top_tracks";
// import { fetchCurrentlyPlaying } from "./component/pages/current_song/live_song";
// import LoadingDots from "./component/pages/components/loading";
// import BottomMiniPlayer from "./component/pages/components/bottom_player/BottomMiniPlayer";
// import ExpandedPlayer from "./component/pages/components/bottom_player/ExpandedPlayer";
// import { Swiper, SwiperSlide } from "swiper/react";
// import "swiper/css";
// import "swiper/css/pagination";
// import { Pagination, Mousewheel, Keyboard } from "swiper/modules";

import RecentlyPlayedList from "./component/info_page/recently_played_list";
import UserTopArtists from "./component/info_page/user_top_artists";
import UserTopTracks from "./component/info_page/user_top_tracks";
import { fetchCurrentlyPlaying } from "./component/current_song/live_song";
import LoadingDots from "./component/components/loading";
import BottomMiniPlayer from "./component/components/bottom_player/BottomMiniPlayer";
import ExpandedPlayer from "./component/components/bottom_player/ExpandedPlayer";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination, Mousewheel, Keyboard } from "swiper/modules";



export default function CurrentlyPlaying({ accessToken, premium, name, userId, deviceConnected }) {
const [song, setSong] = useState(null);
const [isPlaying, setIsPlaying] = useState(false);
const [songID, setSongID] = useState(null);
const [activeIndex, setActiveIndex] = useState(0);
const [swiperRef, setSwiperRef] = useState(null);
const [quit, setQuit] = useState(false);
const [mounted, setMounted] = useState(false);
const waitingForSongRef = useRef(null);

// New state for bottom player
const [isExpanded, setIsExpanded] = useState(false);

const [infoLoadingStates, setInfoLoadingStates] = useState({
    topArtists: true,
    userTopTracks: true,
    recentlyPlayed: true,
});

useEffect(() => {
    setMounted(true);
}, []);

const getSong = async () => {
    if (!accessToken) return;
    const currentSong = await fetchCurrentlyPlaying(accessToken);
    if (currentSong && currentSong.item) {
    setIsPlaying(currentSong.is_playing);
    setSongID(currentSong.item.id);
    setSong(currentSong);
    } else {
    setIsPlaying(false);
    setSong(null);
    }
};

useEffect(() => {
    if (!accessToken) return;

    const fetchSong = async () => {
    const currentSong = await fetchCurrentlyPlaying(accessToken);
    if (currentSong && currentSong.item) {
        setIsPlaying(currentSong.is_playing);
        setSongID(currentSong.item.id);
        setSong(currentSong);

        if (waitingForSongRef.current && currentSong.item.id === waitingForSongRef.current) {
        console.log("New song detected!");
        waitingForSongRef.current = null;
        }
    } else {
        setIsPlaying(false);
        setSong(null);
    }
    };

    fetchSong();
    const interval = setInterval(() => fetchSong(), 5000);
    return () => clearInterval(interval);
}, [accessToken, quit]);

const handlePlayButtonClick = useCallback((trackId) => {
    console.log("🎵 Play button clicked, waiting for track:", trackId);
    waitingForSongRef.current = trackId;
}, []);

const handleTopArtistsLoadingChange = useCallback((isLoading) => {
    setInfoLoadingStates(prev => ({
    ...prev,
    topArtists: isLoading
    }));
}, []);

const handleUserTopTracksLoadingChange = useCallback((isLoading) => {
    setInfoLoadingStates(prev => ({
    ...prev,
    userTopTracks: isLoading
    }));
}, []);

const handleRecentlyPlayedLoadingChange = useCallback((isLoading) => {
    setInfoLoadingStates(prev => ({
    ...prev,
    recentlyPlayed: isLoading
    }));
}, []);

const isAnyInfoLoading = Object.values(infoLoadingStates).some(loading => loading);

useEffect(() => {
    if (isAnyInfoLoading) {
    document.body.style.overflow = 'hidden';

    const bodyChildren = Array.from(document.body.children);
    bodyChildren.forEach((child) => {
        if (!child.getAttribute('data-loading-portal')) {
        child.style.filter = 'blur(4px)';
        child.style.pointerEvents = 'none';
        }
    });
    } else {
    document.body.style.overflow = '';

    const bodyChildren = Array.from(document.body.children);
    bodyChildren.forEach((child) => {
        child.style.filter = '';
        child.style.pointerEvents = '';
    });
    }

    return () => {
    document.body.style.overflow = '';
    const bodyChildren = Array.from(document.body.children);
    bodyChildren.forEach((child) => {
        child.style.filter = '';
        child.style.pointerEvents = '';
    });
    };
}, [isAnyInfoLoading]);

const LoadingOverlay = () => (
    <>
    <div
        className="fixed inset-0 backdrop-blur-sm"
        style={{ zIndex: 999999 }}
    />
    
    <div
        className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
        style={{ zIndex: 1000000 }}
    >
        <div className="flex flex-col items-center justify-center gap-4">
        <LoadingDots size={25} color="#1DB954" activeColor="#1ed760" />
        <p className="text-gray-400 text-sm">Loading...</p>
        </div>
    </div>
    </>
);

//Mobile view stats
const MobileSwiper = () => (
    <div className="block lg:hidden w-full px-4 pb-20 relative">
    <div className="w-full max-w-[640px] mx-auto relative pb-12">
        <Swiper
        slidesPerView={1}
        onSwiper={setSwiperRef}
        onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
        modules={[Pagination, Mousewheel, Keyboard]}
        pagination={{
            clickable: true,
            bulletClass: 'swiper-pagination-bullet',
            bulletActiveClass: 'swiper-pagination-bullet-active',
        }}
        className="mySwiper h-[85vh] "
        style={{
            '--swiper-pagination-color': '#1ed760',
            '--swiper-pagination-bullet-inactive-color': '#1DB954',
            '--swiper-pagination-bottom': '-0px',
        }}
        >
        <SwiperSlide>
            <div className="p-2 h-[80vh] overflow-y-auto" data-tour="top-artists-mobile">
            <UserTopArtists accessToken={accessToken} userId={userId} onLoadingChange={handleTopArtistsLoadingChange} />
            </div>
        </SwiperSlide>
        <SwiperSlide>
            <div className="p-2 h-[80vh] overflow-y-auto" data-tour="top-tracks-mobile">
            <UserTopTracks
                accessToken={accessToken}
                onLoadingChange={handleUserTopTracksLoadingChange}
                onPlayClick={handlePlayButtonClick}
            />
            </div>
        </SwiperSlide>
        <SwiperSlide>
            <div className="p-2 h-[80vh] overflow-y-auto" data-tour="recently-played-mobile">
            <RecentlyPlayedList accessToken={accessToken} name={name} onLoadingChange={handleRecentlyPlayedLoadingChange} />
            </div>
        </SwiperSlide>
        </Swiper>
    </div>
    </div>
);

//Desktop View
return (
    <div className="absolute inset-0 overflow-hidden -mt-5">
    <div className="h-full w-full mx-auto px-[5%] xl:px-6 flex flex-col">
        <div className="flex-1 min-h-0">
        {/* Stats View - Always shown */}
        <div className="w-full h-full">
            {MobileSwiper()}
            <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-12 gap-6 h-[calc(100%-4rem)] min-h-0">
            <div className="lg:col-span-1 xl:col-span-4 h-full min-h-0" data-tour="top-artists">
                <div className="h-full min-h-0 overflow-hidden rounded-xl">
                <UserTopArtists accessToken={accessToken} userId={userId} onLoadingChange={handleTopArtistsLoadingChange} />
                </div>
            </div>
            <div className="lg:col-span-1 xl:col-span-4 h-full min-h-0" data-tour="top-tracks">
                <div className="h-full min-h-0 overflow-hidden rounded-xl">
                <UserTopTracks
                    accessToken={accessToken}
                    onLoadingChange={handleUserTopTracksLoadingChange}
                    onPlayClick={handlePlayButtonClick}
                />
                </div>
            </div>
            <div className="lg:col-span-1 xl:col-span-4 h-[80vh] min-h-0 mt-10" data-tour="recently-played">
                <div className="h-full min-h-0 overflow-hidden rounded-xl">
                <RecentlyPlayedList accessToken={accessToken} name={name} onLoadingChange={handleRecentlyPlayedLoadingChange} />
                </div>
            </div>
            </div>

            {/* Loading overlay for stats */}
            {mounted && isAnyInfoLoading && createPortal(
            <div data-loading-portal="true">
                <LoadingOverlay />
            </div>,
            document.body
            )}
        </div>
        </div>
    </div>

    {/* Bottom Mini Player - shows when song is detected */}
    {song && song.item && (
        <BottomMiniPlayer
        song={song}
        onClick={() => {
            console.log("BottomMiniPlayer clicked!");
            setIsExpanded(true);
        }}
        accessToken={accessToken}
        isPlaying={isPlaying}
        getSong={getSong}
        />
    )}

    {/* Expanded Player Overlay */}
    <ExpandedPlayer
        isExpanded={isExpanded}
        onClose={() => {
        console.log("ExpandedPlayer closing!");
        setIsExpanded(false);
        }}
        song={song}
        isPlaying={isPlaying}
        accessToken={accessToken}
        getSong={getSong}
    />
    </div>
);
>>>>>>> 5625fef1c0320696788e336f69741fec7df9774c
}