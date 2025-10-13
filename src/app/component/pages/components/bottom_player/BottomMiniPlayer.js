"use client";
import Image from "next/image";
import { ChevronUp, Music } from "lucide-react";

export default function BottomMiniPlayer({ song, onClick }) {
  if (!song || !song.item) return null;

  const track = song.item;
  const albumArt = track.album.images[0]?.url;

  return (
    <div
      id="bottom-bar"
      className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-green-500/50 p-3 cursor-pointer hover:bg-zinc-800 transition-all group backdrop-blur-lg bg-opacity-95 z-50"
      onClick={onClick}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">

        {/* LEFT SIDE: Album Art + Song Info */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
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

        {/* RIGHT SIDE: Up Arrow */}
        <div className="flex items-center space-x-4 flex-shrink-0">
          {/* Up Arrow Button */}
          <button className="text-green-500 hover:text-green-400 transition-colors">
            <ChevronUp size={20} className="group-hover:translate-y-[-2px] transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
