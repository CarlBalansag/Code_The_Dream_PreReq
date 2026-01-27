"use client";

import { motion } from 'framer-motion';
import { X, User, ExternalLink } from 'lucide-react';

/**
 * Basic Artist Modal Component
 * Displays basic artist info when user has no listening history for this artist
 *
 * @param {object} artist - Artist object { id, name, image, followers }
 * @param {function} onClose - Function to close the modal
 */
export default function BasicArtistModal({ artist, onClose }) {
  // Don't render if no artist
  if (!artist) return null;

  // Format follower count
  const formatFollowers = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count;
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
        className="bg-[#121212] rounded-xl shadow-2xl w-full sm:w-[500px] max-w-[90vw] max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#121212] border-b border-[#282828] p-3 sm:p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#1DB954]" />
            <h2 className="text-base sm:text-lg font-bold text-white">Artist Info</h2>
          </div>
          <button
            onClick={onClose}
            className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-[#282828] transition-colors flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Artist Image */}
          <div className="flex justify-center mb-6">
            {artist.image ? (
              <img
                src={artist.image}
                alt={artist.name}
                loading="lazy"
                className="w-48 h-48 sm:w-64 sm:h-64 rounded-full shadow-lg object-cover"
              />
            ) : (
              <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-[#282828] flex items-center justify-center">
                <User size={64} className="text-gray-600" />
              </div>
            )}
          </div>

          {/* Artist Name */}
          <div className="text-center mb-6">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">{artist.name}</h3>
            {artist.followers > 0 && (
              <p className="text-gray-400 text-sm">
                {formatFollowers(artist.followers)} followers
              </p>
            )}
          </div>

          {/* No History Message */}
          <div className="bg-[#181818] rounded-lg p-6 text-center mb-4">
            <div className="w-12 h-12 bg-[#282828] rounded-full flex items-center justify-center mx-auto mb-3">
              <User size={24} className="text-gray-500" />
            </div>
            <p className="text-white font-semibold mb-2">No Listening History</p>
            <p className="text-gray-400 text-sm">
              You haven&apos;t listened to {artist.name} yet. Start playing their music to see your listening stats!
            </p>
          </div>

          {/* Spotify Link */}
          <a
            href={`https://open.spotify.com/artist/${artist.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>View on Spotify</span>
            <ExternalLink size={16} />
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}
