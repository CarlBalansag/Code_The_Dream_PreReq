"use client";
import Image from "next/image";
import { ChevronUp, Music, SkipBack, SkipForward, Pause, Play } from "lucide-react";

export default function BottomMiniPlayer({ song, onClick, accessToken, isPlaying, getSong }) {
  if (!song || !song.item) return null;

  const track = song.item;
  const albumArt = track.album.images[0]?.url;

  const handlePrevious = async (e) => {
    e.stopPropagation();
    try {
      await fetch("https://api.spotify.com/v1/me/player/previous", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setTimeout(() => getSong && getSong(), 500);
    } catch (error) {
      console.error("Error skipping to previous:", error);
    }
  };

  const handlePlayPause = async (e) => {
    e.stopPropagation();
    try {
      const endpoint = isPlaying
        ? "https://api.spotify.com/v1/me/player/pause"
        : "https://api.spotify.com/v1/me/player/play";

      await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setTimeout(() => getSong && getSong(), 300);
    } catch (error) {
      console.error("Error toggling playback:", error);
    }
  };

  const handleNext = async (e) => {
    e.stopPropagation();
    try {
      await fetch("https://api.spotify.com/v1/me/player/next", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setTimeout(() => getSong && getSong(), 500);
    } catch (error) {
      console.error("Error skipping to next:", error);
    }
  };

  return (
    <div
      id="bottom-bar"
      className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-green-500/50 p-3 transition-all backdrop-blur-lg bg-opacity-95 z-50"
    >
      <div className="grid grid-cols-3 items-center max-w-7xl mx-auto gap-4">

        {/* LEFT SIDE: Album Art + Song Info */}
        <div className="flex items-center space-x-3 min-w-0">
          {/* Album Art Thumbnail */}
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden">
            {albumArt ? (
              <Image
                src={albumArt}
                alt={track.name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <Music className="text-black" size={20} />
            )}
          </div>

          {/* Song Title and Artist */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{track.name}</p>
            <p className="text-zinc-400 text-xs truncate">
              {track.artists.map(artist => artist.name).join(", ")}
            </p>
          </div>
        </div>

        {/* CENTER: Control Buttons */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handlePrevious}
            className="text-gray-400 hover:text-white transition-colors p-2"
          >
            <SkipBack size={20} fill="currentColor" />
          </button>

          <button
            onClick={handlePlayPause}
            className="text-white hover:text-green-500 transition-colors p-2"
          >
            {isPlaying ? (
              <Pause size={24} fill="currentColor" />
            ) : (
              <Play size={24} fill="currentColor" />
            )}
          </button>

          <button
            onClick={handleNext}
            className="text-gray-400 hover:text-white transition-colors p-2"
          >
            <SkipForward size={20} fill="currentColor" />
          </button>
        </div>

        {/* RIGHT SIDE: Up Arrow */}
        <div className="flex items-center justify-end pr-4">
          <button
            onClick={onClick}
            className="text-white hover:text-[#1DB954] transition-colors p-2"
          >
            <ChevronUp size={28} />
          </button>
        </div>
      </div>
    </div>
  );
}
