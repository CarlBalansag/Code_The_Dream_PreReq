"use client";
import { useState, useEffect } from 'react';
import { Globe, Activity, Users, ArrowUpRight } from 'lucide-react';
import { GLOBAL_ARTISTS, GLOBAL_TRACKS } from './constants';

// Versioned cache keys to force refresh when data shape changes
const CACHE_KEY = 'globalChartsData_v4';
const CACHE_TIMESTAMP_KEY = 'globalChartsTimestamp_v4';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export default function GlobalTrends() {
  const [artists, setArtists] = useState(GLOBAL_ARTISTS);
  const [tracks, setTracks] = useState(GLOBAL_TRACKS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const sortByDailyStreams = (list = []) =>
      [...list].sort((a, b) => (b.dailyStreamsRaw || 0) - (a.dailyStreamsRaw || 0));

    const fetchGlobalCharts = async (useCache = true) => {
      try {
        // Check if we have cached data that's still valid
        if (useCache && typeof window !== 'undefined') {
          const cachedData = localStorage.getItem(CACHE_KEY);
          const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

          if (cachedData && cachedTimestamp) {
            const cacheAge = Date.now() - parseInt(cachedTimestamp);

            // If cache is less than 24 hours old, use it
            if (cacheAge < CACHE_DURATION) {
              const parsedData = JSON.parse(cachedData);
              setArtists(sortByDailyStreams(parsedData.artists || []));
              setTracks(sortByDailyStreams(parsedData.tracks || []));
              setLastUpdated(new Date(parseInt(cachedTimestamp)));
              setLoading(false);
              console.log('�o. Using cached chart data (age:', Math.floor(cacheAge / 1000 / 60 / 60), 'hours)');
              return;
            } else {
              console.log('�?� Cache expired, fetching fresh data...');
            }
          }
        }

        // Fetch fresh data
        const response = await fetch('/api/charts/global');

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('API Error Response:', errorData);
          throw new Error(`Failed to fetch: ${errorData.error || response.statusText}`);
        }

        const data = await response.json();

        if (data.artists && data.tracks) {
          const sortedArtists = sortByDailyStreams(data.artists);
          const sortedTracks = sortByDailyStreams(data.tracks);

          setArtists(sortedArtists);
          setTracks(sortedTracks);

          console.log('GlobalTrends: KWORB scrape success', {
            artists: sortedArtists.length,
            tracks: sortedTracks.length,
            lastUpdated: data.lastUpdated,
          });

          // Cache the data
          if (typeof window !== 'undefined') {
            const timestamp = Date.now();
            localStorage.setItem(CACHE_KEY, JSON.stringify({ artists: sortedArtists, tracks: sortedTracks }));
            localStorage.setItem(CACHE_TIMESTAMP_KEY, timestamp.toString());
            setLastUpdated(new Date(timestamp));
            console.log('�o. Fetched and cached fresh chart data');
          }
        }
      } catch (err) {
        console.error('Error fetching global charts:', err);
        setError(err.message);
        // Keep using mock data on error
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalCharts();
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto mt-12 px-4">
        <div className="flex items-center gap-2 mb-6 justify-center md:justify-start flex-wrap">
            <Globe className="text-spotify animate-pulse" size={20} />
            <h2 className="text-lg font-bold tracking-wider text-white uppercase">Global Live Pulse</h2>
            {loading && <span className="text-xs text-gray-500">(Loading...)</span>}
            {lastUpdated && !loading && (
              <span className="text-xs text-gray-500">
                (Updated {lastUpdated.toLocaleDateString()} at {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </span>
            )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Artists */}
            <div className="bg-dark-900/40 backdrop-blur-sm rounded-xl border border-white/5 p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Users size={18} className="text-blue-400" /> Top Artists
                </h3>
                {artists.map((artist, i) => (
                    <div key={artist.id} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-lg transition-colors">
                        <span className="text-gray-500 font-mono w-4">{i + 1}</span>
                        <img src={artist.img} alt={artist.name} className="w-10 h-10 rounded-full object-cover" />
                        <div className="flex-1">
                          <h4 className="text-white text-sm font-semibold">{artist.name}</h4>
                        </div>
                        <span className="text-xs text-green-400 font-semibold">
                          {artist.dailyStreams ? `${artist.dailyStreams} daily` : artist.listeners}
                        </span>
                    </div>
                ))}
            </div>
             {/* Tracks */}
             <div className="bg-dark-900/40 backdrop-blur-sm rounded-xl border border-white/5 p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Activity size={18} className="text-purple-400" /> Viral Right Now
                </h3>
                {tracks.map((track, i) => (
                    <div key={track.id} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-lg transition-colors">
                        <span className="text-gray-500 font-mono w-4">{i + 1}</span>
                        <img src={track.img} alt={track.title} className="w-10 h-10 rounded object-cover" />
                        <div className="flex-1">
                          <h4 className="text-white text-sm font-semibold">{track.title}</h4>
                          <p className="text-gray-500 text-xs">{track.artist}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-white font-semibold">
                            {track.plays || (track.dailyStreamsRaw ? `${track.dailyStreamsRaw.toLocaleString('en-US')} daily streams` : '')}
                          </p>
                          <ArrowUpRight size={14} className="text-green-400 inline" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}
