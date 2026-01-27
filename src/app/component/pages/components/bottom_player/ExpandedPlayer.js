"use client";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  // Lock body scroll when expanded
  useEffect(() => {
    if (isExpanded) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isExpanded]);

  if (!song || !song.item) return null;

  return (
    <AnimatePresence mode="wait">
      {isExpanded && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            key="expanded-player-backdrop"
            className="fixed inset-0 bg-black/80 z-40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Expanded Player Container */}
          <motion.div
            key="expanded-player"
            id="now-playing-expanded"
            className="fixed inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 z-50"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
        {/* Close Button - Top Right */}
        <button
          id="close-now-playing-btn"
          onClick={onClose}
          className="absolute top-20 right-6 text-white hover:text-[#1DB954] transition-colors z-[100]"
          style={{ pointerEvents: 'auto' }}
          aria-label="Close expanded player"
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
                renderBullet: (index, className) => {
                  return `<span class="${className}" style="width: 12px; height: 12px; margin: 0 6px;"></span>`;
                }
              }}
              className="mySwiper h-full"
              style={{
                "--swiper-pagination-color": "#1ed760",
                "--swiper-pagination-bullet-inactive-color": "rgba(29, 185, 84, 0.3)",
                "--swiper-pagination-bullet-inactive-opacity": "1",
                "--swiper-pagination-bottom": "30px",
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}