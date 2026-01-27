"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
<<<<<<< HEAD
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
=======
import { AnimatePresence } from "framer-motion";
import RecentlyPlayedList from "./component/pages/info_page/recently_played_list";
import UserTopArtists from "./component/pages/info_page/user_top_artists";
import UserTopTracks from "./component/pages/info_page/user_top_tracks";
import { fetchCurrentlyPlaying } from "./component/pages/current_song/live_song";
import BottomMiniPlayer from "./component/pages/components/bottom_player/BottomMiniPlayer";
import ExpandedPlayer from "./component/pages/components/bottom_player/ExpandedPlayer";
import Navbar from "./component/pages/components/navbar/Navbar";
import SongModal from "./component/pages/info_page/SongModal";
import BasicArtistModal from "./component/pages/info_page/BasicArtistModal";
import ArtistModal from "./component/pages/info_page/ArtistModal";

export default function CurrentlyPlaying({ accessToken, premium, name, userId, deviceConnected, tourButton, profileDropdown, onTokenRefresh }) {
  const [song, setSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [songID, setSongID] = useState(null);
  const [quit, setQuit] = useState(false);
  const [mounted, setMounted] = useState(false);
  const waitingForSongRef = useRef(null);

  // New state for bottom player
  const [isExpanded, setIsExpanded] = useState(false);

  const [infoLoadingStates, setInfoLoadingStates] = useState({
    userTopTracks: true,
    recentlyPlayed: true,
  });

  // Search modals state
  const [selectedSong, setSelectedSong] = useState(null);
  const [selectedArtistForBasicModal, setSelectedArtistForBasicModal] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState(null); // For full ArtistModal with history

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
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
        setIsPlaying(currentSong.is_playing);
        setSongID(currentSong.item.id);
        setSong(currentSong);

        if (waitingForSongRef.current && currentSong.item.id === waitingForSongRef.current) {
<<<<<<< HEAD
        console.log("New song detected!");
        waitingForSongRef.current = null;
        }
    } else {
        setIsPlaying(false);
        setSong(null);
    }
=======
          waitingForSongRef.current = null;
        }
      } else {
        setIsPlaying(false);
        setSong(null);
      }
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
    };

    fetchSong();
    const interval = setInterval(() => fetchSong(), 5000);
    return () => clearInterval(interval);
<<<<<<< HEAD
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
=======
  }, [accessToken, quit]);

  const handlePlayButtonClick = useCallback((trackId) => {
    waitingForSongRef.current = trackId;
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

  // Handle artist click from search
  const handleArtistClick = useCallback(async (artist) => {
    try {
      // Check if user has listening history for this artist via API
      const response = await fetch(
        `/api/stats/artist-history-check?userId=${userId}&artistId=${artist.id}`
      );

      if (!response.ok) {
        console.error('Failed to check artist history');
        // Fallback to basic modal on error
        setSelectedArtistForBasicModal(artist);
        return;
      }

      const data = await response.json();
      const hasHistory = data.hasHistory;

      if (hasHistory) {
        // User has history - open full ArtistModal with stats
        setSelectedArtist(artist);
      } else {
        // No history - show basic info modal
        setSelectedArtistForBasicModal(artist);
      }
    } catch (error) {
      console.error('Error checking artist history:', error);
      // Fallback to basic modal on error
      setSelectedArtistForBasicModal(artist);
    }
  }, [userId]);

  // Handle track click from search
  const handleTrackClick = useCallback((track) => {
    setSelectedSong(track);
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
        className="fixed inset-0 bg-[#0D0D0D]/95 backdrop-blur-md"
        style={{ zIndex: 999999 }}
      />

      <div
        className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
        style={{ zIndex: 1000000 }}
      >
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            {/* Spinning ring */}
            <div className="w-20 h-20 border-4 border-[#1DB954]/20 border-t-[#1DB954] rounded-full animate-spin"></div>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Loading Your Stats</h2>
            <p className="text-gray-400">Please wait while we fetch your music data...</p>
          </div>
        </div>
      </div>
    </>
  );

  // NEW Mobile View - Vertical scroll with stacked sections (NO Swiper)
  const MobileView = () => (
    <div className="block lg:hidden w-full pt-16 pb-20 px-4 overflow-y-auto custom-scrollbar h-full relative">
      {/* Content */}
      <div className="relative z-10">
        {/* Top Artists - Horizontal scroll */}
        <div data-tour="top-artists-mobile">
          <UserTopArtists
            accessToken={accessToken}
            userId={userId}
          />
        </div>

        {/* Top Tracks - Vertical scroll, single column */}
        <div data-tour="top-tracks-mobile">
          <UserTopTracks
            accessToken={accessToken}
            onLoadingChange={handleUserTopTracksLoadingChange}
            onPlayClick={handlePlayButtonClick}
          />
        </div>

        {/* Recently Played - Horizontal scroll */}
        <div data-tour="recently-played-mobile">
          <RecentlyPlayedList
            accessToken={accessToken}
            name={name}
            userId={userId}
            onLoadingChange={handleRecentlyPlayedLoadingChange}
            onTokenRefresh={onTokenRefresh}
          />
        </div>
      </div>
    </div>
  );

  //Desktop View
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0D0D0D]">

      {/* Navbar - Fixed at top */}
      <Navbar
        tourButton={tourButton}
        profileDropdown={profileDropdown}
        accessToken={accessToken}
        userId={userId}
        onArtistClick={handleArtistClick}
        onTrackClick={handleTrackClick}
      />

      <main id="main-content" className="relative h-full w-full flex flex-col z-10">
        <div className="flex-1 min-h-0">
          {/* Stats View - Always shown */}
          <div className="w-full h-full">
            {/* MOBILE - NEW vertical scroll layout */}
            {MobileView()}

            {/* DESKTOP - Full width layout */}
            <div className="hidden lg:block h-full w-full overflow-y-auto custom-scrollbar">
              <div className="w-full max-w-[1920px] mx-auto px-10 pt-20 pb-28">
                {/* Top Artists - Full width, horizontal scroll */}
                <div className="h-auto min-h-[280px] mt-[-20px]" data-tour="top-artists">
                  <UserTopArtists accessToken={accessToken} userId={userId} />
                </div>

                {/* Top Tracks - Full width */}
                <div className="h-auto min-h-[400px]" data-tour="top-tracks">
                  <UserTopTracks
                    accessToken={accessToken}
                    onLoadingChange={handleUserTopTracksLoadingChange}
                    onPlayClick={handlePlayButtonClick}
                  />
                </div>

                {/* Recently Played - Full width, horizontal scroll */}
                <div className="h-auto min-h-[280px] " data-tour="recently-played">
                  <RecentlyPlayedList
                    accessToken={accessToken}
                    name={name}
                    userId={userId}
                    onLoadingChange={handleRecentlyPlayedLoadingChange}
                    onTokenRefresh={onTokenRefresh}
                  />
                </div>
              </div>
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
            </div>

            {/* Loading overlay for stats */}
            {mounted && isAnyInfoLoading && createPortal(
<<<<<<< HEAD
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
=======
              <div data-loading-portal="true">
                <LoadingOverlay />
              </div>,
              document.body
            )}
          </div>
        </div>
      </main>

      {/* Bottom Mini Player - shows when song is detected */}
      {song && song.item && (
        <BottomMiniPlayer
          song={song}
          onClick={() => setIsExpanded(true)}
          accessToken={accessToken}
          isPlaying={isPlaying}
          getSong={getSong}
        />
      )}

      {/* Expanded Player Overlay */}
      <ExpandedPlayer
        isExpanded={isExpanded}
        onClose={() => setIsExpanded(false)}
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
        song={song}
        isPlaying={isPlaying}
        accessToken={accessToken}
        getSong={getSong}
<<<<<<< HEAD
    />
    </div>
);
=======
      />

      {/* Song Modal - from search */}
      <AnimatePresence mode="wait">
        {selectedSong && (
          <SongModal
            key="song-modal"
            song={selectedSong}
            userId={userId}
            onClose={() => setSelectedSong(null)}
            onArtistClick={handleArtistClick}
          />
        )}
      </AnimatePresence>

      {/* Artist Modal - from search (with history) */}
      <AnimatePresence mode="wait">
        {selectedArtist && (
          <ArtistModal
            key="artist-modal"
            artist={selectedArtist}
            userId={userId}
            fromSearch={true}
            onClose={() => setSelectedArtist(null)}
          />
        )}
      </AnimatePresence>

      {/* Basic Artist Modal - from search (no history) */}
      <AnimatePresence mode="wait">
        {selectedArtistForBasicModal && (
          <BasicArtistModal
            key="basic-artist-modal"
            artist={selectedArtistForBasicModal}
            onClose={() => setSelectedArtistForBasicModal(null)}
          />
        )}
      </AnimatePresence>

      {/* Custom Animations & Styling */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;700;900&display=swap');

        * {
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

      `}</style>
    </div>
  );
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
}