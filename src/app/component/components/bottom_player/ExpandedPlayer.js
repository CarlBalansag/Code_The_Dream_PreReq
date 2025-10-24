"use client";
import { useState, useCallback, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Mousewheel, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

import LiveSong from "../../current_song/live_song";
import PremiumTopTracks from "../../current_song/premiumTopTracks";
import PremiumAlbum from "../../current_song/premiumAlbum";
import LiveSongSkeleton from "../skeletons/LiveSongSkeleton";
import TopTracksSkeleton from "../skeletons/TopTracksSkeleton";
import AlbumsSkeleton from "../skeletons/AlbumsSkeleton";

export default function ExpandedPlayer({
  isExpanded,
  onClose,
  song,
  isPlaying,
  accessToken,
  getSong,
  onLiveSongLoadingChange,
  onTopTracksLoadingChange,
  onAlbumsLoadingChange,
}) {
  const [loadingStates, setLoadingStates] = useState({
    liveSong: true,
    topTracks: true,
    albums: true,
  });

  // Animation state: null (not mounted), 'entering', 'entered', 'exiting'
  const [animationState, setAnimationState] = useState(null);

  const handleLiveSongLoading = useCallback((isLoading) => {
    setLoadingStates(prev => ({ ...prev, liveSong: isLoading }));
    if (onLiveSongLoadingChange) onLiveSongLoadingChange(isLoading);
  }, [onLiveSongLoadingChange]);

  const handleTopTracksLoading = useCallback((isLoading) => {
    setLoadingStates(prev => ({ ...prev, topTracks: isLoading }));
    if (onTopTracksLoadingChange) onTopTracksLoadingChange(isLoading);
  }, [onTopTracksLoadingChange]);

  const handleAlbumsLoading = useCallback((isLoading) => {
    setLoadingStates(prev => ({ ...prev, albums: isLoading }));
    if (onAlbumsLoadingChange) onAlbumsLoadingChange(isLoading);
  }, [onAlbumsLoadingChange]);

  // Handle opening animation
  useEffect(() => {
    if (isExpanded) {
      if (animationState === null) {
        // Mount and start entering
        setAnimationState('entering');
        // Trigger animation after mount
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setAnimationState('entered');
          });
        });
      } else if (animationState === 'exiting') {
        // If trying to open while exiting, reset to entering
        setAnimationState('entering');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setAnimationState('entered');
          });
        });
      }
    } else if (!isExpanded && (animationState === 'entered' || animationState === 'entering')) {
      // Start exit animation
      setAnimationState('exiting');
      // Wait for animation to complete before unmounting
      const timeout = setTimeout(() => {
        setAnimationState(null);
      }, 500); // Match transition duration
      return () => clearTimeout(timeout);
    }
  }, [isExpanded, animationState]);

  // Lock body scroll when expanded
  useEffect(() => {
    if (animationState === 'entered') {
      // Save original overflow
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore original overflow
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [animationState]);

  const handleClose = () => {
    // Just call onClose, let the useEffect handle the animation
    onClose();
  };

  if (!song || !song.item) return null;

  // Don't render at all if not mounted
  if (animationState === null) return null;

  // Determine transform based on animation state
  const getTransform = () => {
    switch (animationState) {
      case 'entering':
        return 'translate-y-full';
      case 'entered':
        return 'translate-y-0';
      case 'exiting':
        return 'translate-y-full';
      default:
        return 'translate-y-full';
    }
  };

  const getBackdropOpacity = () => {
    return animationState === 'entered' ? 'opacity-100' : 'opacity-0';
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black/80 transition-opacity duration-500 z-40 ${getBackdropOpacity()} ${animationState === 'entered' ? 'pointer-events-auto' : 'pointer-events-none'}`}
        onClick={animationState === 'entered' ? handleClose : undefined}
      />

      {/* Expanded Player Container */}
      <div
        id="now-playing-expanded"
        className={`fixed inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 transition-transform duration-500 ease-out z-50 ${getTransform()}`}
      >
        {/* Close Button - Top Right */}
        <button
          id="close-now-playing-btn"
          onClick={handleClose}
          className="absolute top-20 right-6 text-white hover:text-[#1DB954] transition-colors z-[100]"
          style={{ pointerEvents: 'auto' }}
        >
          <ChevronDown size={28} />
        </button>

        {/* Mobile View: Swiper */}
        <div className="block lg:hidden w-full h-full px-4 pb-16 pointer-events-none">
          <div className="w-full max-w-[640px] mx-auto h-full pt-20 pointer-events-auto">
            <Swiper
              slidesPerView={1}
              modules={[Pagination, Mousewheel, Keyboard]}
              pagination={{
                clickable: true,
                bulletClass: "swiper-pagination-bullet",
                bulletActiveClass: "swiper-pagination-bullet-active",
              }}
              className="mySwiper h-full"
              style={{
                "--swiper-pagination-color": "#1ed760",
                "--swiper-pagination-bullet-inactive-color": "#1DB954",
                "--swiper-pagination-bottom": "20px",
              }}
            >
              <SwiperSlide>
                <div className="h-full overflow-y-auto flex items-center justify-center relative">
                  {loadingStates.liveSong && <LiveSongSkeleton />}
                  <div className={loadingStates.liveSong ? "hidden" : ""}>
                    <LiveSong
                      song={song}
                      isPlaying={isPlaying}
                      accessToken={accessToken}
                      getSong={getSong}
                      onLoadingChange={handleLiveSongLoading}
                    />
                  </div>
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <div className="h-full overflow-y-auto p-4 relative">
                  {loadingStates.topTracks && <TopTracksSkeleton />}
                  <div className={loadingStates.topTracks ? "hidden" : ""}>
                    <PremiumTopTracks
                      artistId={song.item.artists[0].id}
                      accessToken={accessToken}
                      onLoadingChange={handleTopTracksLoading}
                    />
                  </div>
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <div className="h-full overflow-y-auto p-4 relative">
                  {loadingStates.albums && <AlbumsSkeleton />}
                  <div className={loadingStates.albums ? "hidden" : ""}>
                    <PremiumAlbum
                      artistId={song.item.artists[0].id}
                      accessToken={accessToken}
                      onLoadingChange={handleAlbumsLoading}
                    />
                  </div>
                </div>
              </SwiperSlide>
            </Swiper>
          </div>
        </div>

        {/* Desktop View: 3-Column Grid */}
        <div className="hidden lg:block h-full w-full px-6 py-16">
          <div className="max-w-[95vw] mx-auto h-full">
            <div className="grid grid-cols-3 gap-6 h-full">
              {/* Column 1: Live Song */}
              <div className="h-full overflow-hidden rounded-xl flex items-center justify-center relative">
                {loadingStates.liveSong && <LiveSongSkeleton />}
                <div className={loadingStates.liveSong ? "hidden" : ""}>
                  <LiveSong
                    song={song}
                    isPlaying={isPlaying}
                    accessToken={accessToken}
                    getSong={getSong}
                    onLoadingChange={handleLiveSongLoading}
                  />
                </div>
              </div>

              {/* Column 2: Top Tracks */}
              <div className="h-full overflow-hidden rounded-xl relative">
                <div className="p-4 h-full overflow-y-auto custom-scrollbar">
                  {loadingStates.topTracks && <TopTracksSkeleton />}
                  <div className={loadingStates.topTracks ? "hidden" : ""}>
                    <PremiumTopTracks
                      artistId={song.item.artists[0].id}
                      accessToken={accessToken}
                      onLoadingChange={handleTopTracksLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Column 3: Albums */}
              <div className="h-full overflow-hidden rounded-xl relative">
                <div className="p-4 h-full overflow-y-auto custom-scrollbar">
                  {loadingStates.albums && <AlbumsSkeleton />}
                  <div className={loadingStates.albums ? "hidden" : ""}>
                    <PremiumAlbum
                      artistId={song.item.artists[0].id}
                      accessToken={accessToken}
                      onLoadingChange={handleAlbumsLoading}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}