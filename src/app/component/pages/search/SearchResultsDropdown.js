"use client";

import { Music, User } from 'lucide-react';

/**
 * Search Results Dropdown Component
 * Displays search results below the search bar with artists and tracks
 *
 * @param {object} results - Search results { artists: [], tracks: [], total: number }
 * @param {boolean} loading - Loading state
 * @param {function} onArtistClick - Callback when artist is clicked
 * @param {function} onTrackClick - Callback when track is clicked
 * @param {function} onClose - Callback to close dropdown
 */
export default function SearchResultsDropdown({
  results,
  loading,
  onArtistClick,
  onTrackClick,
  onClose,
}) {
  const { artists = [], tracks = [], total = 0 } = results || {};
  const hasResults = total > 0;

  // Don't render if no results and not loading
  if (!loading && !hasResults) {
    return null;
  }

  // Format follower count
  const formatFollowers = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M followers`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K followers`;
    }
    return `${count} followers`;
  };

  // Format duration
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute top-full left-0 right-0 sm:right-auto sm:w-[400px] mt-2 mx-2 sm:mx-0 bg-[#282828] rounded-lg shadow-2xl border border-[#404040] overflow-hidden z-50 max-h-[70vh] sm:max-h-[400px] overflow-y-auto custom-scrollbar">
      {loading && (
        <div className="p-4">
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-12 h-12 bg-[#404040] rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-[#404040] rounded w-3/4 mb-2" />
              <div className="h-3 bg-[#404040] rounded w-1/2" />
            </div>
          </div>
        </div>
      )}

      {!loading && hasResults && (
        <div>
          {/* Artists Section */}
          {artists.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <User size={14} />
                Artists
              </div>
              {artists.map((artist) => (
                <button
                  key={artist.id}
                  onClick={() => {
                    onArtistClick(artist);
                    onClose();
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#333333] transition-colors text-left group"
                >
                  {artist.image ? (
                    <img
                      src={artist.image}
                      alt={artist.name}
                      loading="lazy"
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#404040] flex items-center justify-center flex-shrink-0">
                      <User size={24} className="text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate group-hover:text-[#1DB954] transition-colors">
                      {artist.name}
                    </p>
                    <p className="text-gray-400 text-xs truncate">
                      {formatFollowers(artist.followers)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Tracks Section */}
          {tracks.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Music size={14} />
                Songs
              </div>
              {tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => {
                    onTrackClick(track);
                    onClose();
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#333333] transition-colors text-left group"
                >
                  {track.image ? (
                    <img
                      src={track.image}
                      alt={track.album}
                      loading="lazy"
                      className="w-12 h-12 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-[#404040] flex items-center justify-center flex-shrink-0">
                      <Music size={24} className="text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate group-hover:text-[#1DB954] transition-colors">
                      {track.name}
                    </p>
                    <p className="text-gray-400 text-xs truncate">
                      {track.artist} • {track.album}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && !hasResults && (
        <div className="p-6 text-center">
          <p className="text-gray-400 text-sm">No results found</p>
        </div>
      )}
    </div>
  );
}
