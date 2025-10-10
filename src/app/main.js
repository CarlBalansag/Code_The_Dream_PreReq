"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import LiveSong from "./component/pages/current_song/live_song";
import RecentlyPlayedList from "./component/pages/info_page/recently_played_list";
import PremiumTopTracks from "./component/pages/current_song/premiumTopTracks";
import PremiumAlbum from "./component/pages/current_song/premiumAlbum";
import UserTopArtists from "./component/pages/info_page/user_top_artists";
import UserTopTracks from "./component/pages/info_page/user_top_tracks";
import FloatingActionButton from "./component/pages/info_page/floating_action";
import { fetchCurrentlyPlaying } from "./component/pages/current_song/live_song";
import QuitButton from "./component/pages/current_song/quit_song";
import LoadingDots from "./component/pages/components/loading";
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
  const [showInfoPage, setShowInfoPage] = useState(true);
  const [mounted, setMounted] = useState(false);
  const waitingForSongRef = useRef(null); // Track which song we're waiting for
  const setShowInfoPageCallbackRef = useRef(null); // Store setShowInfoPage callback
  
  // Track loading states for all three components (now playing view)
  const [loadingStates, setLoadingStates] = useState({
    liveSong: true,
    topTracks: true,
    albums: true,
  });

  // Track loading states for info page components
  const [infoLoadingStates, setInfoLoadingStates] = useState({
    topArtists: true,
    userTopTracks: true,
    recentlyPlayed: true,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

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
    
    const fetchSong = async () => {
      const currentSong = await fetchCurrentlyPlaying(accessToken);
      if (currentSong && currentSong.item) {
        setIsPlaying(currentSong.is_playing);
        setSongID(currentSong.item.id);
        setSong(currentSong);
        
        // Check if this is the song we're waiting for
        if (waitingForSongRef.current && currentSong.item.id === waitingForSongRef.current) {
          console.log("✅ New song detected! Switching to LiveSong view...");
          // New song detected! Switch to LiveSong view
          waitingForSongRef.current = null;
          if (setShowInfoPageCallbackRef.current) {
            setShowInfoPageCallbackRef.current(false);
            setShowInfoPageCallbackRef.current = null;
          }
        }
      } else {
        setIsPlaying(false);
        setSong(null);
      }
    };
    
    fetchSong();
    const interval = setInterval(() => fetchSong(), 3000);
    return () => clearInterval(interval);
  }, [accessToken, quit]);

  const toggleNowPlaying = () => {
    // If switching TO now playing view (showInfoPage is currently true)
    // immediately set all loading states to true
    if (showInfoPage) {
      setLoadingStates({
        liveSong: true,
        topTracks: true,
        albums: true,
      });
    } else {
      // If switching TO info page (showInfoPage is currently false)
      // immediately set info loading states to true
      setInfoLoadingStates({
        topArtists: true,
        userTopTracks: true,
        recentlyPlayed: true,
      });
    }
    setShowInfoPage((prev) => !prev);
  };

  // Callback for when play button is clicked - stay on info page and show loading until new song detected
  const handlePlayButtonClick = useCallback((trackId, setShowInfoPageCallback) => {
    console.log("🎵 Play button clicked, waiting for track:", trackId);
    
    // Store the trackId we're waiting for and the callback
    waitingForSongRef.current = trackId;
    setShowInfoPageCallbackRef.current = setShowInfoPageCallback;
    
    // Set info loading states to true to show loading overlay
    setInfoLoadingStates({
      topArtists: true,
      userTopTracks: true,
      recentlyPlayed: true,
    });
    
    // Reset loading states for now playing view (in preparation)
    setLoadingStates({
      liveSong: true,
      topTracks: true,
      albums: true,
    });
  }, []);

  // Add this helper to track loading - Create stable callbacks for each component
  const handleLiveSongLoadingChange = useCallback((isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      liveSong: isLoading
    }));
  }, []);

  const handleTopTracksLoadingChange = useCallback((isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      topTracks: isLoading
    }));
  }, []);

  const handleAlbumsLoadingChange = useCallback((isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      albums: isLoading
    }));
  }, []);

  // Info page loading callbacks
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

  // Check if ANY component is loading
  const isAnyLoading = Object.values(loadingStates).some(loading => loading);
  const isAnyInfoLoading = Object.values(infoLoadingStates).some(loading => loading);

  // Prevent body scroll and add blur when loading
  useEffect(() => {
    const shouldShowLoading = showInfoPage ? isAnyInfoLoading : isAnyLoading;
    
    if (shouldShowLoading) {
      // Loading state - apply blur to body
      document.body.style.overflow = 'hidden';
      
      const bodyChildren = Array.from(document.body.children);
      bodyChildren.forEach((child) => {
        if (!child.getAttribute('data-loading-portal')) {
          child.style.filter = 'blur(4px)';
          child.style.pointerEvents = 'none';
        }
      });
    } else {
      // Loaded - restore
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
  }, [isAnyLoading, isAnyInfoLoading, showInfoPage]);

  // Loading state component using React Portal
  const LoadingOverlay = () => (
    <>
      {/* Blurred backdrop layer */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        style={{ zIndex: 999999 }}
      />
      
      {/* Content layer - appears above backdrop without blur */}
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

  // no song playing mobile view 
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
              <UserTopArtists accessToken={accessToken} onLoadingChange={handleTopArtistsLoadingChange} />
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="p-2 h-full overflow-y-auto">
              <UserTopTracks 
                accessToken={accessToken} 
                setShowInfoPage={setShowInfoPage} 
                onLoadingChange={handleUserTopTracksLoadingChange}
                onPlayClick={handlePlayButtonClick}
              />
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="p-2 h-full overflow-y-auto">
              <RecentlyPlayedList accessToken={accessToken} name={name} onLoadingChange={handleRecentlyPlayedLoadingChange} />
            </div>
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
  );

  // A song is playing on mobile view 
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
          <SwiperSlide key="livesong-mobile">
            <div className="p-2 h-full overflow-hidden">
              <LiveSong 
                song={song} 
                isPlaying={isPlaying} 
                accessToken={accessToken} 
                getSong={getSong}
                onLoadingChange={handleLiveSongLoadingChange}
              />
              <div className="mt-2 flex justify-center">
                <QuitButton setSong={setSong} setQuit={setQuit} accessToken={accessToken} setShowInfoPage={setShowInfoPage} />
              </div>
            </div>
          </SwiperSlide>
          {song && song.item && (
            <>
              <SwiperSlide key="toptracks-mobile">
                <div className="p-2 h-full overflow-hidden">
                  <PremiumTopTracks 
                    artistId={song.item.artists[0].id} 
                    accessToken={accessToken}
                    onLoadingChange={handleTopTracksLoadingChange}
                  />
                </div>
              </SwiperSlide>
              <SwiperSlide key="album-mobile">
                <div className="p-2 h-full overflow-hidden">
                  <PremiumAlbum 
                    artistId={song.item.artists[0].id} 
                    accessToken={accessToken}
                    onLoadingChange={handleAlbumsLoadingChange}
                  />
                </div>
              </SwiperSlide>
            </>
          )}
        </Swiper>
      </div>
    </div>
  );

  //Desktop view
  return (
    <div className="absolute inset-0 overflow-hidden -mt-5">
      {/* layout shell */}
      <div className="h-full w-full mx-auto px-[5%] xl:px-6 flex flex-col">
        {/* CONTENT AREA */}
        <div className="flex-1 min-h-0">
          {premium ? (
            showInfoPage ? (
              <div className="w-full h-full">
                {MobileSwiper()}
                {/* Desktop / Large screens - Info Page Layout */}
                <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-12 gap-6 h-[calc(100%-4rem)] min-h-0">
                  <div className="lg:col-span-1 xl:col-span-4 h-full min-h-0">
                    <div className="h-full min-h-0 overflow-hidden rounded-xl">
                      <UserTopArtists accessToken={accessToken} onLoadingChange={handleTopArtistsLoadingChange} />
                    </div>
                  </div>
                  <div className="lg:col-span-1 xl:col-span-4 h-full min-h-0 ">
                    <div className="h-full min-h-0 overflow-hidden rounded-xl">
                      <UserTopTracks 
                        accessToken={accessToken} 
                        setShowInfoPage={setShowInfoPage} 
                        onLoadingChange={handleUserTopTracksLoadingChange}
                        onPlayClick={handlePlayButtonClick}
                      />
                    </div>
                  </div>
                  <div className="lg:col-span-1 xl:col-span-4 h-full min-h-0 mt-10">
                    <div className="h-full min-h-0 overflow-hidden rounded-xl">
                      <RecentlyPlayedList accessToken={accessToken} name={name} onLoadingChange={handleRecentlyPlayedLoadingChange} />
                    </div>
                  </div>
                </div>
                {/* Floating Action Button to toggle to Now Playing */}
                {song && song.item && (
                  <div id="floating-action-button">
                    <FloatingActionButton onClick={toggleNowPlaying} showInfoPage={showInfoPage} />
                  </div>
                )}
                {/* Loading Overlay - Shows when ANY of the three components are loading */}
                {mounted && isAnyInfoLoading && createPortal(
                  <div data-loading-portal="true">
                    <LoadingOverlay />
                  </div>,
                  document.body
                )}
              </div>
            ) : (
              <>                
                {MobileNowPlayingSwiper()}
                {/* Desktop / Large screens - FIXED LAYOUT Device is premium and is currently playing music*/}
                {song && song.item ? (
                  <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-12 gap-6 h-full min-h-0">
                    {/* First column - Live Song */}
                    <div className="lg:col-span-1 xl:col-span-4 h-full min-h-0">
                      <div className="h-full min-h-0 overflow-hidden rounded-xl">
                        <div className="p-4">
                          <LiveSong 
                            song={song} 
                            isPlaying={isPlaying} 
                            accessToken={accessToken} 
                            getSong={getSong}
                            onLoadingChange={handleLiveSongLoadingChange}
                          />
                          <div className="mt-5 pl-18 text-center">
                            {/* <QuitButton setSong={setSong} setQuit={setQuit} accessToken={accessToken} setShowInfoPage={setShowInfoPage} /> */}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Second column - Premium Top Tracks */}
                    <div className="lg:col-span-1 xl:col-span-4 h-full min-h-0">
                      <div className="h-full min-h-0 rounded-xl">
                        {/* REMOVED overflow-y-auto from wrapper to prevent double scrollbars */}
                        <div className="p-4 h-full">
                          <PremiumTopTracks 
                            artistId={song.item.artists[0].id} 
                            accessToken={accessToken}
                            onLoadingChange={handleTopTracksLoadingChange}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Third column - Premium Album */}
                    <div className="lg:col-span-1 xl:col-span-4 h-full min-h-0">
                      <div className="h-full min-h-0 rounded-xl">
                        {/* REMOVED overflow-y-auto from wrapper to prevent double scrollbars */}
                        <div className="p-4 h-full">
                          <PremiumAlbum 
                            artistId={song.item.artists[0].id} 
                            accessToken={accessToken}
                            onLoadingChange={handleAlbumsLoadingChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="hidden lg:flex items-center justify-center h-full">
                    <p className="text-white">Loading song data...</p>
                  </div>
                )}
                {/* Floating Action Button to toggle back to Stats */}
                <div id="floating-action-button">
                  <FloatingActionButton onClick={toggleNowPlaying} showInfoPage={showInfoPage} />
                </div>

                {/* Loading Overlay - Shows when ANY of the three components are loading */}
                {mounted && isAnyLoading && createPortal(
                  <div data-loading-portal="true">
                    <LoadingOverlay />
                  </div>,
                  document.body
                )}
              </>
            )
          ) : (
            <div className="w-full h-full">
              <p className="text-red-500 text-xl font-semibold mb-4">Not a Premium Member</p>
              {MobileSwiper()}
              <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-12 gap-6 h-[calc(100%-4rem)] min-h-0">
                <div className="lg:col-span-1 xl:col-span-4 h-full min-h-0">
                  <UserTopArtists accessToken={accessToken} onLoadingChange={handleTopArtistsLoadingChange} />
                </div>
                <div className="lg:col-span-1 xl:col-span-4 h-full min-h-0">
                  <UserTopTracks 
                    accessToken={accessToken} 
                    onLoadingChange={handleUserTopTracksLoadingChange}
                    onPlayClick={handlePlayButtonClick}
                  />
                </div>
                <div className="lg:col-span-1 xl:col-span-4 h-full min-h-0">
                  <RecentlyPlayedList accessToken={accessToken} name={name} onLoadingChange={handleRecentlyPlayedLoadingChange} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}