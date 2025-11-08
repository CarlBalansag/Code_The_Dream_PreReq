"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Music, Calendar, Clock } from 'lucide-react';

/**
 * Song Modal Component
 * Displays detailed information about a song with user's play count
 *
 * @param {object} song - Song object { id, name, artist, artistId, album, image, duration, releaseDate }
 * @param {string} userId - User's Spotify ID
 * @param {function} onClose - Function to close the modal
 * @param {function} onArtistClick - Function when artist name is clicked
 */
export default function SongModal({ song, userId, onClose, onArtistClick }) {
  const [playCount, setPlayCount] = useState(null);
  const [loading, setLoading] = useState(true);

  // Don't render if no song
  if (!song) return null;

  // Fetch user's play count for this song
  useEffect(() => {
    async function fetchPlayCount() {
      if (!song.id || !userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `/api/stats/track-play-count?userId=${userId}&trackId=${song.id}`
        );

        if (response.ok) {
          const data = await response.json();
          setPlayCount(data.playCount || 0);
        } else {
          setPlayCount(0);
        }
      } catch (error) {
        console.error('Error fetching play count:', error);
        setPlayCount(0);
      } finally {
        setLoading(false);
      }
    }

    fetchPlayCount();
  }, [song.id, userId]);

  // Format duration
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format release date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Handle background click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md"
      onClick={handleBackdropClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-[#121212] rounded-xl shadow-2xl w-full sm:w-[600px] max-w-[90vw] max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#121212] border-b border-[#282828] p-3 sm:p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-[#1DB954]" />
            <h2 className="text-base sm:text-lg font-bold text-white">Song Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#282828] transition-colors flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Album Art */}
          <div className="flex justify-center mb-6">
            {song.image ? (
              <img
                src={song.image}
                alt={song.album}
                className="w-48 h-48 sm:w-64 sm:h-64 rounded-lg shadow-lg object-cover"
              />
            ) : (
              <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-lg bg-[#282828] flex items-center justify-center">
                <Music size={64} className="text-gray-600" />
              </div>
            )}
          </div>

          {/* Song Info */}
          <div className="text-center mb-6">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">{song.name}</h3>
            <button
              onClick={() => {
                if (song.artistId && onArtistClick) {
                  onArtistClick({
                    id: song.artistId,
                    name: song.artist,
                    image: null,
                  });
                }
              }}
              className="text-lg text-gray-300 hover:text-[#1DB954] hover:underline transition-colors"
              disabled={!song.artistId || !onArtistClick}
            >
              {song.artist}
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Play Count */}
            <div className="bg-[#181818] rounded-lg p-4 text-center">
              <p className="text-gray-400 text-xs mb-2">Your Plays</p>
              {loading ? (
                <div className="h-8 bg-[#282828] rounded animate-pulse" />
              ) : (
                <p className="text-white text-2xl font-bold">
                  {playCount !== null ? playCount : 'N/A'}
                </p>
              )}
            </div>

            {/* Duration */}
            <div className="bg-[#181818] rounded-lg p-4 text-center">
              <p className="text-gray-400 text-xs mb-2 flex items-center justify-center gap-1">
                <Clock size={12} />
                Duration
              </p>
              <p className="text-white text-2xl font-bold">
                {formatDuration(song.duration)}
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-[#181818] rounded-lg p-4 space-y-3">
            <div>
              <p className="text-gray-400 text-xs mb-1">Album</p>
              <p className="text-white text-sm font-semibold">{song.album}</p>
            </div>

            {song.releaseDate && (
              <div>
                <p className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                  <Calendar size={12} />
                  Release Date
                </p>
                <p className="text-white text-sm">{formatDate(song.releaseDate)}</p>
              </div>
            )}
          </div>

          {/* Play Count Message */}
          {!loading && playCount === 0 && (
            <div className="mt-4 p-3 bg-[#282828] rounded-lg text-center">
              <p className="text-gray-400 text-sm">
                You haven't listened to this song yet
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
