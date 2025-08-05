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
        className="absolute top-1/2 left-0 transform -translate-y-1/2 z-50 text-[3.5rem] font-bold text-[#1DB954] lg:hidden"
      >
        ‹
      </button>
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
        <div className="text-sm text-red-400 mb-2 text-center ml-11">
          {swipeHintsInfoPage[activeIndex]}
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
              <UserTopTracks accessToken={accessToken} getSong={getSong} setShowInfoPage={setShowInfoPage} />
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

  const MobileNowPlayingSwiper = () => (
    <div className="block lg:hidden flex justify-center px-4 relative overflow-visible w-full pb-14">
      <div className="w-full max-w-[600px] relative overflow-visible pr-10">
        <MobileNavigation />
        <div className="text-sm text-red-400 mb-2 text-center ml-11">
          {swipeHintsLiveSong[activeIndex]}
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
              <LiveSong song={song} isPlaying={isPlaying} accessToken={accessToken} getSong={getSong} />
              <div className="ml-30 sm:ml-12 lg:ml-18 mt-5">
                <QuitButton setSong={setSong} setQuit={setQuit} accessToken={accessToken} setShowInfoPage={setShowInfoPage} />
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="overflow-hidden p-4">
              <PremiumTopTracks artistId={song.item.artists[0].id} accessToken={accessToken} />
            </div>
          </SwiperSlide>
          <SwiperSlide> 
            <div className="overflow-hidden p-4">
              <PremiumAlbum artistId={song.item.artists[0].id} accessToken={accessToken} />
            </div>
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="w-[90%] mx-auto xl:ml-5 h-full">
        {premium ? (
          !deviceConnected && !showInfoPage && song && song.item ? (
            <>
              {MobileNowPlayingSwiper()}
              <div className="hidden lg:flex flex-col gap-8 md:flex-row">
                <div className="basis-1/3 text-center">
                  <LiveSong song={song} isPlaying={isPlaying} accessToken={accessToken} getSong={getSong} />
                  <div className="ml-5 sm:ml-12 lg:ml-18 mt-5">
                    <QuitButton setSong={setSong} setQuit={setQuit} accessToken={accessToken} setShowInfoPage={setShowInfoPage} />
                  </div>
                </div>
                <div className="basis-1/3">
                  <PremiumTopTracks artistId={song.item.artists[0].id} accessToken={accessToken} />
                </div>
                <div className="basis-1/3">
                  <PremiumAlbum artistId={song.item.artists[0].id} accessToken={accessToken} />
                </div>
              </div>
            </>
          ) : (
            <div className="text-center w-full h-full">
              {MobileSwiper()}
              <div className="hidden lg:flex flex-row w-full h-full">
                <div className="text-white pl-7 text-center basis-5/12">
                  <UserTopArtists accessToken={accessToken} />
                </div>
                <div className="pl-7 basis-6/12">
                  <UserTopTracks accessToken={accessToken} getSong={getSong} setShowInfoPage={setShowInfoPage} />
                </div>
                <div className="pl-7 basis-6/12">
                  <RecentlyPlayedList accessToken={accessToken} name={name} />
                </div>
              </div>
              <FloatingActionButton />
            </div>
          )
        ) : (
          <div className="text-center w-full h-full">
            <p className="text-red-500 text-xl font-semibold mb-4">Not a Premium Member</p>
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
    </div>
  );
}
