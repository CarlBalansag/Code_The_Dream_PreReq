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
import "swiper/css/pagination";
import { Pagination, Mousewheel, Keyboard } from "swiper/modules";

export default function CurrentlyPlaying({ accessToken, premium, name, deviceConnected, tourActive }) {
  const [song, setSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [songID, setSongID] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [swiperRef, setSwiperRef] = useState(null);
  const [quit, setQuit] = useState(false);
  const [showInfoPage, setShowInfoPage] = useState(true);
  const [mounted, setMounted] = useState(false);
  const waitingForSongRef = useRef(null);
  const setShowInfoPageCallbackRef = useRef(null);
  
  const [loadingStates, setLoadingStates] = useState({
    liveSong: true,
    topTracks: true,
    albums: true,
  });

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
          console.log("✅ New song detected! Switching to LiveSong view...");
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
    if (showInfoPage) {
      setLoadingStates({
        liveSong: true,
        topTracks: true,
        albums: true,
      });
    } else {
      setInfoLoadingStates({
        topArtists: true,
        userTopTracks: true,
        recentlyPlayed: true,
      });
    }
    setShowInfoPage((prev) => !prev);
  };

  const handlePlayButtonClick = useCallback((trackId, setShowInfoPageCallback) => {
    console.log("🎵 Play button clicked, waiting for track:", trackId);
    
    waitingForSongRef.current = trackId;
    setShowInfoPageCallbackRef.current = setShowInfoPageCallback;
    
    setInfoLoadingStates({
      topArtists: true,
      userTopTracks: true,
      recentlyPlayed: true,
    });
    
    setLoadingStates({
      liveSong: true,
      topTracks: true,
      albums: true,
    });
  }, []);

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

  const isAnyLoading = Object.values(loadingStates).some(loading => loading);
  const isAnyInfoLoading = Object.values(infoLoadingStates).some(loading => loading);

  useEffect(() => {
    const shouldShowLoading = showInfoPage ? isAnyInfoLoading : isAnyLoading;
    
    if (shouldShowLoading) {
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
  }, [isAnyLoading, isAnyInfoLoading, showInfoPage]);

  const LoadingOverlay = () => (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
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

  //Mobile view no song is playing 
  const MobileSwiper = () => (
    <div className="block lg:hidden w-full px-4 pb-16 relative">
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
              <UserTopArtists accessToken={accessToken} onLoadingChange={handleTopArtistsLoadingChange} />
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="p-2 h-[80vh] overflow-y-auto" data-tour="top-tracks-mobile">
              <UserTopTracks 
                accessToken={accessToken} 
                setShowInfoPage={setShowInfoPage} 
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

  //Mobile view Song is Playing
  const MobileNowPlayingSwiper = () => (
    <div className="block lg:hidden w-full px-4 pb-16 relative">
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
            '--swiper-pagination-bottom': '0px',
          }}
        >
          <SwiperSlide key="livesong-mobile">
            <div className="p-2 h-[80vh] overflow-hidden">
              <LiveSong 
                song={song} 
                isPlaying={isPlaying} 
                accessToken={accessToken} 
                getSong={getSong}
                onLoadingChange={handleLiveSongLoadingChange}
              />
              <div className="mt-2 flex justify-center">
              </div>
            </div>
          </SwiperSlide>
          {song && song.item && (
            <>
              <SwiperSlide key="toptracks-mobile">
                <div className="p-2 h-[80vh] overflow-hidden">
                  <PremiumTopTracks 
                    artistId={song.item.artists[0].id} 
                    accessToken={accessToken}
                    onLoadingChange={handleTopTracksLoadingChange}
                  />
                </div>
              </SwiperSlide>
              <SwiperSlide key="album-mobile">
                <div className="p-2 h-[80vh] overflow-hidden">
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

  //Desktop View
  return (
    <div className="absolute inset-0 overflow-hidden -mt-5">
      <div className="h-full w-full mx-auto px-[5%] xl:px-6 flex flex-col">
        <div className="flex-1 min-h-0">
          {premium ? (
            showInfoPage ? (
              <div className="w-full h-full">
                {MobileSwiper()}
                <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-12 gap-6 h-[calc(100%-4rem)] min-h-0">
                  <div className="lg:col-span-1 xl:col-span-4 h-full min-h-0" data-tour="top-artists">
                    <div className="h-full min-h-0 overflow-hidden rounded-xl">
                      <UserTopArtists accessToken={accessToken} onLoadingChange={handleTopArtistsLoadingChange} />
                    </div>
                  </div>
                  <div className="lg:col-span-1 xl:col-span-4 h-full min-h-0" data-tour="top-tracks">
                    <div className="h-full min-h-0 overflow-hidden rounded-xl">
                      <UserTopTracks 
                        accessToken={accessToken} 
                        setShowInfoPage={setShowInfoPage} 
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
                {(song && song.item || tourActive) && (
                  <FloatingActionButton onClick={toggleNowPlaying} showInfoPage={showInfoPage} tourActive={tourActive} />
                )}
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
                {song && song.item ? (
                  <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-12 gap-6 h-full min-h-0">
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
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="lg:col-span-1 xl:col-span-4 h-full min-h-0">
                      <div className="h-full min-h-0 rounded-xl">
                        <div className="p-4 h-full">
                          <PremiumTopTracks 
                            artistId={song.item.artists[0].id} 
                            accessToken={accessToken}
                            onLoadingChange={handleTopTracksLoadingChange}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="lg:col-span-1 xl:col-span-4 h-full min-h-0">
                      <div className="h-full min-h-0 rounded-xl">
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
                <div id="floating-action-button">
                  <FloatingActionButton onClick={toggleNowPlaying} showInfoPage={showInfoPage} />
                </div>

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
                <div className="lg:col-span-1 xl:col-span-4 h-full min-h-0" data-tour="top-artists">
                  <UserTopArtists accessToken={accessToken} onLoadingChange={handleTopArtistsLoadingChange} />
                </div>
                <div className="lg:col-span-1 xl:col-span-4 h-full min-h-0" data-tour="top-tracks">
                  <UserTopTracks 
                    accessToken={accessToken} 
                    onLoadingChange={handleUserTopTracksLoadingChange}
                    onPlayClick={handlePlayButtonClick}
                  />
                </div>
                <div className="lg:col-span-1 xl:col-span-4 h-full min-h-0" data-tour="recently-played">
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