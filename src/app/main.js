"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import RecentlyPlayedList from "./component/pages/info_page/recently_played_list";
import UserTopArtists from "./component/pages/info_page/user_top_artists";
import UserTopTracks from "./component/pages/info_page/user_top_tracks";
import { fetchCurrentlyPlaying } from "./component/pages/current_song/live_song";
import LoadingDots from "./component/pages/components/loading";
import BottomMiniPlayer from "./component/pages/components/bottom_player/BottomMiniPlayer";
import ExpandedPlayer from "./component/pages/components/bottom_player/ExpandedPlayer";
import Navbar from "./component/pages/components/navbar/Navbar";
import SongModal from "./component/pages/info_page/SongModal";
import BasicArtistModal from "./component/pages/info_page/BasicArtistModal";
import ArtistModal from "./component/pages/info_page/ArtistModal";

export default function CurrentlyPlaying({ accessToken, premium, name, userId, deviceConnected, tourButton, profileDropdown }) {
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
    console.log('🎨 Artist clicked from search:', artist);

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
        console.log('User has history for this artist - opening ArtistModal');
        console.log('Artist object:', artist);
        setSelectedArtist(artist);
      } else {
        // No history - show basic info modal
        console.log('No history for this artist - opening BasicArtistModal');
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
    console.log('🎵 Track clicked from search:', track);
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

  // NEW Mobile View - Vertical scroll with stacked sections (NO Swiper)
  const MobileView = () => (
    <div className="block lg:hidden w-full pt-16 pb-20 px-4 overflow-y-auto custom-scrollbar h-full">
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
          onLoadingChange={handleRecentlyPlayedLoadingChange}
        />
      </div>
    </div>
  );

  //Desktop View
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Navbar - Fixed at top */}
      <Navbar
        tourButton={tourButton}
        profileDropdown={profileDropdown}
        accessToken={accessToken}
        userId={userId}
        onArtistClick={handleArtistClick}
        onTrackClick={handleTrackClick}
      />

      <main id="main-content" className="h-full w-full flex flex-col">
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
      </main>

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
    </div>
  );
}