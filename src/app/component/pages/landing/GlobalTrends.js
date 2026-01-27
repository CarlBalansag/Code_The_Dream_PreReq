"use client";
import { useEffect, useState } from 'react';
import { Globe, Activity, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { GLOBAL_ARTISTS, GLOBAL_TRACKS } from './constants';

const FALLBACK_IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%231DB954"/><text x="50" y="54" font-size="36" text-anchor="middle" fill="black" font-family="Arial, sans-serif">&#9835;</text></svg>';
const ARTISTS_CACHE_KEY = 'global_artists_cache';
const TRACKS_CACHE_KEY = 'global_tracks_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Format relative time (e.g., "2 hours ago")
 */
function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

/**
 * Format absolute time (e.g., "Jan 26, 3:45 PM")
 */
function getAbsoluteTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export default function GlobalTrends() {
  const [artists, setArtists] = useState(GLOBAL_ARTISTS);
  const [tracks, setTracks] = useState(GLOBAL_TRACKS);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoadingArtists, setIsLoadingArtists] = useState(true);
  const [isLoadingTracks, setIsLoadingTracks] = useState(true);

  useEffect(() => {
    async function fetchGlobalArtists() {
      try {
        // Check localStorage cache first
        const cached = localStorage.getItem(ARTISTS_CACHE_KEY);
        if (cached) {
          const { data, lastUpdated: cachedTime, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;

          // If cache is less than 24 hours old, use it
          if (age < CACHE_DURATION) {
            setArtists(data);
            setLastUpdated(cachedTime);
            setIsLoadingArtists(false);
            return;
          }
        }

        // Fetch fresh data from API
        const response = await fetch('/api/landing/global-artists');
        const result = await response.json();

        if (result.success && result.data?.length > 0) {
          setArtists(result.data);
          setLastUpdated(result.lastUpdated);

          // Save to localStorage
          localStorage.setItem(ARTISTS_CACHE_KEY, JSON.stringify({
            data: result.data,
            lastUpdated: result.lastUpdated,
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        console.error('Failed to fetch global artists:', error);
        // Keep fallback data
      } finally {
        setIsLoadingArtists(false);
      }
    }

    async function fetchGlobalTracks() {
      try {
        // Check localStorage cache first
        const cached = localStorage.getItem(TRACKS_CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;

          // If cache is less than 24 hours old, use it
          if (age < CACHE_DURATION) {
            setTracks(data);
            setIsLoadingTracks(false);
            return;
          }
        }

        // Fetch fresh data from API
        const response = await fetch('/api/landing/global-tracks');
        const result = await response.json();

        if (result.success && result.data?.length > 0) {
          setTracks(result.data);

          // Save to localStorage
          localStorage.setItem(TRACKS_CACHE_KEY, JSON.stringify({
            data: result.data,
            lastUpdated: result.lastUpdated,
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        console.error('Failed to fetch global tracks:', error);
        // Keep fallback data
      } finally {
        setIsLoadingTracks(false);
      }
    }

    fetchGlobalArtists();
    fetchGlobalTracks();
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 sm:mt-12 px-2 sm:px-4">
        <div className="flex items-center gap-2 mb-2 justify-center md:justify-start flex-wrap">
            <Globe className="text-spotify animate-pulse w-4 h-4 sm:w-5 sm:h-5" />
            <h2 className="text-base sm:text-lg font-bold tracking-wider text-white uppercase">Global Charts</h2>
        </div>
        {lastUpdated && (
          <span className="text-[10px] sm:text-xs text-gray-500 block mb-4 sm:mb-6 text-center md:text-left">
            Last updated: {getRelativeTime(lastUpdated)} ({getAbsoluteTime(lastUpdated)})
          </span>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {/* Artists */}
            <div className="bg-dark-900/40 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/5 p-3 sm:p-4 md:p-6">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <Users className="text-blue-400 w-4 h-4 sm:w-[18px] sm:h-[18px]" /> Top Artists
                </h3>
                {isLoadingArtists ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
                        <span className="w-4 h-4 bg-gray-700 rounded"></span>
                        <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-700 rounded w-24"></div>
                          <div className="h-3 bg-gray-700 rounded w-16"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  artists.map((artist, i) => (
                    <div key={artist.id} className="flex items-center gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 hover:bg-white/5 rounded-lg transition-colors">
                        <span className="text-gray-500 font-mono w-4 text-xs sm:text-sm">{artist.rank || i + 1}</span>
                        <img
                          src={artist.imageUrl || artist.img || FALLBACK_IMG}
                          alt={artist.name}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
                          onError={(e) => { e.target.src = FALLBACK_IMG; }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white text-xs sm:text-sm font-semibold truncate">{artist.name}</h4>
                          <span className={`text-[10px] sm:text-xs flex items-center gap-1 ${artist.isPositive !== undefined ? (artist.isPositive ? 'text-green-400' : 'text-red-400') : 'text-gray-400'}`}>
                            {artist.dailyChangeFormatted ? (
                              <>
                                {artist.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                <span className="hidden xs:inline">Daily:</span> {artist.dailyChangeFormatted}
                              </>
                            ) : (
                              artist.trend || ''
                            )}
                          </span>
                        </div>
                        <span className="text-[10px] sm:text-xs text-spotify font-semibold whitespace-nowrap">
                          {artist.listenersFormatted || artist.listeners}
                        </span>
                    </div>
                  ))
                )}
            </div>
             {/* Tracks */}
             <div className="bg-dark-900/40 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/5 p-3 sm:p-4 md:p-6">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <Activity className="text-purple-400 w-4 h-4 sm:w-[18px] sm:h-[18px]" /> Viral Right Now
                </h3>
                {isLoadingTracks ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
                        <span className="w-4 h-4 bg-gray-700 rounded"></span>
                        <div className="w-10 h-10 bg-gray-700 rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-700 rounded w-28"></div>
                          <div className="h-3 bg-gray-700 rounded w-20"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  tracks.map((track, i) => (
                    <div key={track.id} className="flex items-center gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 hover:bg-white/5 rounded-lg transition-colors">
                        <span className="text-gray-500 font-mono w-4 text-xs sm:text-sm">{track.rank || i + 1}</span>
                        <img
                          src={track.imageUrl || track.img || FALLBACK_IMG}
                          alt={track.title}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover flex-shrink-0"
                          onError={(e) => { e.target.src = FALLBACK_IMG; }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white text-xs sm:text-sm font-semibold truncate">{track.title}</h4>
                          <p className="text-gray-500 text-[10px] sm:text-xs truncate">{track.artist}</p>
                        </div>
                        <span className="text-[10px] sm:text-xs text-spotify font-semibold whitespace-nowrap">
                          {track.streamsFormatted || track.plays}
                        </span>
                    </div>
                  ))
                )}
            </div>
        </div>
    </div>
  );
}
