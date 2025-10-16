"use client";

import { useState } from 'react';
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
export default function ArtistModal({ artist, userId, onClose }) {
  const [timeRange, setTimeRange] = useState('30D');

  // Fetch artist history data
  const { data, loading, error } = useArtistHistory(
    artist?.id,
    userId,
    timeRange,
    artist?.name, // Pass artist name for fallback matching
    !!artist // Only fetch when artist is provided
  );

  // Don't render if no artist
  if (!artist) return null;

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
              <p className="text-sm text-gray-300">
                {artist.name}: <span className="font-semibold text-white">{data.artistSongs} plays</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
              <p className="text-sm text-gray-300">
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

  // Handle background click
  const handleBackdropClick = (e) => {
    // Only close if clicking the backdrop itself, not its children
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-[#121212] rounded-xl shadow-2xl w-[80vw] max-h-[85vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#121212] border-b border-[#282828] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {artist.image && (
              <img
                src={artist.image}
                alt={artist.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            )}
            <div>
              <h2 className="text-lg font-bold text-white">{artist.name}</h2>
              <p className="text-xs text-gray-400">Listening History</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#282828] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Time Range Selector */}
        <div className="p-4 border-b border-[#282828]">
          <div className="flex flex-wrap gap-2">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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

        {/* Chart Area */}
        <div className="p-4">
          {loading && (
            <div className="flex items-center justify-center h-[250px]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 text-sm">Loading chart data...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-[250px]">
              <div className="text-center">
                <p className="text-gray-400 text-base">No info on {artist.name}</p>
              </div>
            </div>
          )}

          {!loading && !error && data && data.chartData && data.chartData.length > 0 && (
            <div>
              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-[#181818] rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Total Plays</p>
                  <p className="text-white text-lg font-bold">{data.totalPlays}</p>
                </div>
                <div className="bg-[#181818] rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Days Tracked</p>
                  <p className="text-white text-lg font-bold">{data.totalDays}</p>
                </div>
                <div className="bg-[#181818] rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Avg/Day</p>
                  <p className="text-white text-lg font-bold">
                    {(data.totalPlays / data.totalDays).toFixed(1)}
                  </p>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-[#181818] rounded-lg p-3">
                <h3 className="text-white text-sm font-semibold mb-3">
                  Daily Listening Activity
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={data.chartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
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
                      style={{ fontSize: '12px' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#999999" style={{ fontSize: '12px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
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

              {/* Insights */}
              <div className="mt-4 bg-[#181818] rounded-lg p-3">
                <h3 className="text-white text-sm font-semibold mb-2">Insights</h3>
                <div className="space-y-1.5 text-xs">
                  <p className="text-gray-300">
                    • You&apos;ve listened to <span className="text-[#1DB954] font-semibold">{artist.name}</span> a total of <span className="font-semibold">{data.totalPlays} times</span> in the last {timeRange}
                  </p>
                  <p className="text-gray-300">
                    • That&apos;s an average of <span className="font-semibold">{(data.totalPlays / data.totalDays).toFixed(1)} plays per day</span>
                  </p>
                  {data.chartData.length > 0 && (
                    <p className="text-gray-300">
                      • Peak listening was on <span className="font-semibold">{data.chartData.reduce((max, day) => day.artistSongs > max.artistSongs ? day : max).fullDate}</span> with <span className="font-semibold">{data.chartData.reduce((max, day) => Math.max(max, day.artistSongs), 0)} plays</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {!loading && !error && (!data || !data.chartData || data.chartData.length === 0) && (
            <div className="flex items-center justify-center h-[250px]">
              <div className="text-center">
                <p className="text-gray-400 text-base">No info on {artist.name}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
