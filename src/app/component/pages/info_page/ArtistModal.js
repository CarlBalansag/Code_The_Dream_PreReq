"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useArtistHistory } from '@/hooks/useArtistHistory';

/**
 * Artist Modal Component
 * Displays listening history chart for a specific artist
 *
 * @param {object} artist - Artist object { id, name, image }
 * @param {string} userId - User's Spotify ID
 * @param {function} onClose - Function to close the modal
 */
export default function ArtistModal({ artist, userId, onClose, fromSearch = false }) {
  // Start with 'ALL' for search results to check total plays
  const [timeRange, setTimeRange] = useState(fromSearch ? 'ALL' : '30D');

  // Store the all-time total plays to determine if we should show time range selector
  const [allTimeTotalPlays, setAllTimeTotalPlays] = useState(null);

  // Fetch artist history data
  const { data, loading, error } = useArtistHistory(
    artist?.id,
    userId,
    timeRange,
    artist?.name, // Pass artist name for fallback matching
    !!artist // Only fetch when artist is provided
  );

  // Capture all-time total plays when timeRange is 'ALL'
  useEffect(() => {
    if (fromSearch && timeRange === 'ALL' && data && data.totalPlays !== undefined && allTimeTotalPlays === null) {
      setAllTimeTotalPlays(data.totalPlays);
    }
  }, [data, timeRange, fromSearch, allTimeTotalPlays]);

  // Add escape key support
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Don't render if no artist
  if (!artist) return null;

  // Check if user has less than 100 plays using all-time data (not current time range)
  const hasLimitedHistory = fromSearch && allTimeTotalPlays !== null && allTimeTotalPlays < 100;

  // Time range options
  const timeRangeOptions = [
    { value: '7D', label: '7 Days' },
    { value: '30D', label: '1 Month' },
    { value: 'ALL', label: 'All Time' },
  ];

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#282828] border border-[#404040] rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-2">{data.fullDate}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#1DB954]" />
              <p className="text-sm text-gray-200">
                {artist.name}: <span className="font-semibold text-white">{data.artistSongs} plays</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
              <p className="text-sm text-gray-200">
                Total: <span className="font-semibold text-white">{data.totalSongs} plays</span>
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-600">
              <p className="text-xs text-gray-400">
                {data.percentage}% of your listening
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const formatListeningTime = (ms) => {
    if (!ms || ms <= 0) {
      return '0m';
    }

    const totalMinutes = Math.floor(ms / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) {
      return `${days}d${hours > 0 ? ` ${hours}h` : ''}`;
    }
    if (hours > 0) {
      return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
    }
    return `${minutes}m`;
  };

  const getListeningTimeTooltip = (ms) => {
    if (!ms || ms <= 0) {
      return 'No listening time yet';
    }

    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const parts = [];

    if (hours > 0) {
      parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
    }
    if (minutes > 0) {
      parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
    }

    return parts.join(' ') || 'Less than 1 minute';
  };

  // Handle background click
  const handleBackdropClick = (e) => {
    // Only close if clicking the backdrop itself, not its children
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
      transition={{ duration: 0.4 }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="bg-[#121212] rounded-xl shadow-2xl w-full sm:w-[90vw] lg:w-[80vw] max-w-[1200px] max-h-[90vh] sm:max-h-[85vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#121212] border-b border-[#282828] p-3 sm:p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
            {artist.image && (
              <img
                src={artist.image}
                alt={artist.name}
                loading="lazy"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold text-white truncate">{artist.name}</h2>
              <p className="text-xs text-gray-400 hidden sm:block">Listening History</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-[#282828] transition-colors flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Time Range Selector - Only show if user has 100+ plays */}
        {!hasLimitedHistory && (
          <div className="p-3 sm:p-4 border-b border-[#282828]">
            <div className="flex flex-wrap gap-2">
              {timeRangeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeRange(option.value)}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    timeRange === option.value
                      ? 'bg-[#1DB954] text-black'
                      : 'bg-[#282828] text-white hover:bg-[#333333]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chart Area */}
        <div className="p-3 sm:p-4">
          {loading && (
            <div className="flex items-center justify-center h-[200px] sm:h-[250px]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 text-xs sm:text-sm">Loading chart data...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-[200px] sm:h-[250px]">
              <div className="text-center">
                <p className="text-gray-400 text-sm sm:text-base">No info on {artist.name}</p>
              </div>
            </div>
          )}

          {!loading && !error && data && data.chartData && data.chartData.length > 0 && (
            <div>
              {/* Stats Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="bg-[#181818] rounded-lg p-2 sm:p-3">
                  <p className="text-gray-400 text-[10px] sm:text-xs mb-1">Total Plays</p>
                  <p className="text-white text-base sm:text-lg font-bold">{data.totalPlays}</p>
                </div>
                <div className="bg-[#181818] rounded-lg p-2 sm:p-3">
                  <p className="text-gray-400 text-[10px] sm:text-xs mb-1">Favorite Song</p>
                  <p className="text-white text-base sm:text-lg font-bold truncate" title={data.favoriteTrack?.trackName || 'N/A'}>
                    {data.favoriteTrack?.trackName || 'N/A'}
                  </p>
                </div>
                <div className="bg-[#181818] rounded-lg p-2 sm:p-3">
                  <p className="text-gray-400 text-[10px] sm:text-xs mb-1">Listening Time</p>
                  <p
                    className="text-white text-base sm:text-lg font-bold"
                    title={getListeningTimeTooltip(data.totalListeningTimeMs)}
                  >
                    {formatListeningTime(data.totalListeningTimeMs)}
                  </p>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-[#181818] rounded-lg p-2 sm:p-3">
                <h3 className="text-white text-xs sm:text-sm font-semibold mb-2 sm:mb-3">
                  Daily Listening Activity
                </h3>
                <div className="w-full overflow-x-auto">
                  <ResponsiveContainer width="100%" height={250} minWidth={300}>
                    <AreaChart
                      data={data.chartData}
                      margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorArtist" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1DB954" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#1DB954" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                      <XAxis
                        dataKey="date"
                        stroke="#999999"
                        style={{ fontSize: '10px' }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        stroke="#999999"
                        style={{ fontSize: '10px' }}
                        width={40}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
                        iconType="circle"
                        iconSize={8}
                      />
                      <Area
                        type="monotone"
                        dataKey="totalSongs"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorTotal)"
                        name="Total Songs"
                      />
                      <Area
                        type="monotone"
                        dataKey="artistSongs"
                        stroke="#1ed760"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorArtist)"
                        name={artist.name}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Insights */}
              <div className="mt-3 sm:mt-4 bg-[#181818] rounded-lg p-2 sm:p-3">
                <h3 className="text-white text-xs sm:text-sm font-semibold mb-2">Insights</h3>
                <div className="space-y-1.5 text-[10px] sm:text-xs">
                  <p className="text-gray-200">
                    • You&apos;ve listened to <span className="text-[#1DB954] font-semibold">{artist.name}</span> a total of <span className="font-semibold">{data.totalPlays} times</span>{hasLimitedHistory ? '' : ` in the last ${timeRange}`}
                  </p>
                  <p className="text-gray-200">
                    • That&apos;s an average of <span className="font-semibold">{(data.totalPlays / data.totalDays).toFixed(1)} plays per day</span>
                  </p>
                  {data.chartData.length > 0 && (
                    <p className="text-gray-200">
                      • Peak listening was on <span className="font-semibold">{data.chartData.reduce((max, day) => day.artistSongs > max.artistSongs ? day : max).fullDate}</span> with <span className="font-semibold">{data.chartData.reduce((max, day) => Math.max(max, day.artistSongs), 0)} plays</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {!loading && !error && (!data || !data.chartData || data.chartData.length === 0) && (
            <div className="flex items-center justify-center h-[200px] sm:h-[250px]">
              <div className="text-center">
                <p className="text-gray-400 text-sm sm:text-base">No info on {artist.name}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
