"use client";
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
          className="mySwiper h-[70vh]"
        >
          <SwiperSlide>
            <div className="p-2 h-full overflow-y-auto">
              <LiveSong song={song} isPlaying={isPlaying} accessToken={accessToken} getSong={getSong} />
              <div className="mt-5 flex justify-center">
                <QuitButton setSong={setSong} setQuit={setQuit} accessToken={accessToken} setShowInfoPage={setShowInfoPage} />
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="p-2 h-full overflow-y-auto">
              <PremiumTopTracks artistId={song.item.artists[0].id} accessToken={accessToken} />
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="p-2 h-full overflow-y-auto">
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
                {/* Desktop / Large screens */}
                <div className="hidden lg:grid grid-cols-12 gap-6 h-full min-h-0">
                  <div className="col-span-12 xl:col-span-4 h-full min-h-0">
                    <div className="h-full min-h-0 overflow-hidden rounded-xl">
                      <div className="p-4">
                        <LiveSong song={song} isPlaying={isPlaying} accessToken={accessToken} getSong={getSong} />
                        <div className="mt-5">
                          <QuitButton setSong={setSong} setQuit={setQuit} accessToken={accessToken} setShowInfoPage={setShowInfoPage} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-12 sm:col-span-6 xl:col-span-4 h-full min-h-0">
                    <div className="h-full min-h-0 overflow-hidden rounded-xl">
                      <div className="h-full min-h-0 overflow-y-auto p-4">
                        <PremiumTopTracks artistId={song.item.artists[0].id} accessToken={accessToken} />
                      </div>
                    </div>
                  </div>
                  <div className="col-span-12 sm:col-span-6 xl:col-span-4 h-full min-h-0">
                    <div className="h-full min-h-0 overflow-hidden rounded-xl">
                      <div className="h-full min-h-0 overflow-y-auto p-4">
                        <PremiumAlbum artistId={song.item.artists[0].id} accessToken={accessToken} />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full">
                {MobileSwiper()}
                {/* Desktop / Large screens */}
                <div className="hidden lg:grid grid-cols-12 gap-6 h-[calc(100%-4rem)] min-h-0">
                  <div className="col-span-12 md:col-span-4 h-full min-h-0">
                    <div className="h-full min-h-0 overflow-hidden rounded-xl">
                      <UserTopArtists accessToken={accessToken} />
                    </div>
                  </div>
                  <div className="col-span-12 md:col-span-4 h-full min-h-0">
                    <div className="h-full min-h-0 overflow-hidden rounded-xl">
                      <UserTopTracks accessToken={accessToken} setShowInfoPage={setShowInfoPage} />
                    </div>
                  </div>
                  <div className="col-span-12 md:col-span-4 h-full min-h-0">
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
              <div className="hidden lg:grid grid-cols-12 gap-6 h-[calc(100%-4rem)] min-h-0">
                <div className="col-span-12 md:col-span-4 h-full min-h-0">
                  <UserTopArtists accessToken={accessToken} />
                </div>
                <div className="col-span-12 md:col-span-4 h-full min-h-0">
                  <UserTopTracks accessToken={accessToken} />
                </div>
                <div className="col-span-12 md:col-span-4 h-full min-h-0">
                  <RecentlyPlayedList accessToken={accessToken} name={name} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}