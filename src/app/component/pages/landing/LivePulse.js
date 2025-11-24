"use client";
import { useEffect, useState } from 'react';
import { Disc, BarChart2, Clock } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, CartesianGrid } from 'recharts';
import { MOCK_TOP_ARTISTS, MOCK_RECENT_TRACKS, MOCK_TOP_TRACKS_LIST } from './constants';

const FALLBACK_IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%231DB954"/><text x="50" y="54" font-size="36" text-anchor="middle" fill="black" font-family="Arial, sans-serif">&#9835;</text></svg>';

const DATA_7_DAYS = [
  { day: 'Mon', drake: 2, total: 15 },
  { day: 'Tue', drake: 5, total: 22 },
  { day: 'Wed', drake: 8, total: 30 },
  { day: 'Thu', drake: 4, total: 25 },
  { day: 'Fri', drake: 12, total: 45 },
  { day: 'Sat', drake: 15, total: 50 },
  { day: 'Sun', drake: 10, total: 35 }
];

const DATA_30_DAYS = [
  { day: 'Oct 20', drake: 5, total: 45 },
  { day: 'Nov 6', drake: 25, total: 80 },
  { day: 'Nov 19', drake: 6, total: 30 }
];

const DATA_ALL_TIME = [
  { day: '2020', drake: 150, total: 800 },
  { day: '2024', drake: 580, total: 1800 }
];

export default function LivePulse() {
  const [deepDiveRange, setDeepDiveRange] = useState('1 Month');
  const [artists, setArtists] = useState(MOCK_TOP_ARTISTS);
  const [tracks, setTracks] = useState(MOCK_TOP_TRACKS_LIST);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const chartData = deepDiveRange === '7 Days' ? DATA_7_DAYS : deepDiveRange === '1 Month' ? DATA_30_DAYS : DATA_ALL_TIME;

  const handleImgError = (e) => {
    const target = e?.target;
    if (target) {
      target.onerror = null;
      target.src = FALLBACK_IMG;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchLivePulse = async () => {
      try {
        const res = await fetch('/api/charts/global');

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch live pulse');
        }

        const data = await res.json();

        if (!isMounted) return;

        if (data?.artists?.length) setArtists(data.artists);
        if (data?.tracks?.length) setTracks(data.tracks);
        if (data?.lastUpdated) setLastUpdated(data.lastUpdated);

        console.log('LivePulse: KWORB scrape success', {
          artists: data?.artists?.length || 0,
          tracks: data?.tracks?.length || 0,
          lastUpdated: data?.lastUpdated,
        });
      } catch (err) {
        console.error('Failed to load live pulse from Kworb:', err);
        if (!isMounted) return;
        setError('Showing demo data while live feed is unavailable.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLivePulse();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="relative w-full max-w-5xl mx-auto perspective-1000 animate-fade-in-up">
      <div className="absolute -inset-4 bg-spotify/20 blur-3xl rounded-full opacity-40 animate-pulse-slow pointer-events-none"></div>
      <div className="relative glass-panel rounded-xl border border-white/10 shadow-2xl overflow-hidden bg-[#0a0a0a]/90 backdrop-blur-xl">
        {/* Header */}
        <div className="h-10 bg-white/5 border-b border-white/5 flex items-center justify-between px-4 sticky top-0 z-50 backdrop-blur-md">
          <div className="flex gap-1.5 group">
             <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] group-hover:scale-110 transition-transform"></div>
             <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] group-hover:scale-110 transition-transform"></div>
             <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F] group-hover:scale-110 transition-transform"></div>
          </div>
          <div className="text-[10px] font-medium text-gray-500 tracking-widest uppercase flex items-center gap-2">
             <div className="w-2 h-2 bg-spotify rounded-full animate-pulse"></div> SonicPulse Web Player
          </div>
          <div className="w-12"></div>
        </div>

        <div className="p-5 md:p-8 flex flex-col gap-8">
          <div className="flex justify-between items-end border-b border-white/5 pb-4 animate-fade-in-up delay-100">
            <div><h2 className="text-2xl font-bold text-white mb-1">Good Evening, Alex</h2></div>
            <div className="flex items-center gap-1"><p className="text-[10px] text-spotify font-bold uppercase tracking-widest">Live Tracking Active</p></div>
          </div>

          {/* Top Artists */}
          <div className="relative animate-fade-in-up delay-200">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Disc className="text-spotify" size={18}/> Top Artists</h3>
              {loading && <span className="text-[11px] text-gray-500">Loading...</span>}
              {lastUpdated && !loading && (
                <span className="text-[11px] text-gray-500">
                  Updated {new Date(lastUpdated).toLocaleDateString()} {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {error && <span className="text-[11px] text-yellow-400">{error}</span>}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {artists.slice(0, 5).map((artist, index) => (
                <div key={artist.id || `${artist.name}-${index}`} className="bg-[#181818] p-4 rounded-xl border border-white/5 hover:border-spotify/50 flex flex-col items-center transition-all">
                    <img src={artist.imageUrl || artist.img} onError={handleImgError} alt={artist.name} className="w-20 h-20 rounded-full mb-3 object-cover" />
                    <h3 className="text-white font-bold text-sm">{artist.name}</h3>
                    <span className="text-[10px] text-gray-400">#{index + 1} Ranked</span>
                </div>
            ))}
            </div>
          </div>

          {/* Deep Dive Chart */}
          <div className="bg-gradient-to-br from-[#121212] to-[#0d0d0d] rounded-xl p-6 border border-white/10 animate-fade-in-up delay-300">
            <div className="flex justify-between mb-6">
                <div className="flex gap-4 items-center">
                    <img src={MOCK_TOP_ARTISTS[0].imageUrl} onError={handleImgError} alt="Drake" className="w-14 h-14 rounded-full border-2 border-spotify" />
                    <div><h2 className="text-2xl font-bold text-white">Drake</h2><p className="text-gray-400 text-xs">Deep Dive Analytics</p></div>
                </div>
            </div>
            <div className="flex gap-2 mb-6">
                {['7 Days', '1 Month', 'All Time'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setDeepDiveRange(r)}
                      className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${deepDiveRange === r ? 'bg-spotify text-black' : 'text-gray-400 hover:text-white'}`}
                    >
                      {r}
                    </button>
                ))}
            </div>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="cDrake" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1DB954" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#1DB954" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#333" vertical={false} opacity={0.5} />
                      <Area type="monotone" dataKey="drake" stroke="#1DB954" fill="url(#cDrake)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
          </div>

          {/* Top Tracks */}
          <div className="animate-fade-in-up delay-500">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><BarChart2 className="text-spotify" size={18}/> Top Tracks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#121212] p-4 rounded-xl border border-white/5">
                {tracks.slice(0, 4).map((track, index) => (
                    <div key={track.id || track.rank || `${track.title}-${index}`} className="flex items-center p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <span className="w-6 text-white/50 font-mono">{track.rank || track.id?.split('-')?.[1] || ''}</span>
                        <img src={track.imageUrl || track.img} onError={handleImgError} alt={track.title} className="w-10 h-10 rounded mr-3 object-cover" />
                        <div><h4 className="text-white text-sm font-bold">{track.title}</h4><p className="text-gray-400 text-xs">{track.artist}</p></div>
                    </div>
                ))}
            </div>
          </div>

          {/* Recently Played */}
          <div className="animate-fade-in-up delay-700">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Clock className="text-spotify" size={18}/> Recently Played</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(tracks.length ? tracks : MOCK_RECENT_TRACKS).slice(0, 4).map((track, index) => (
                    <div key={track.id || track.rank || `${track.title}-${index}`} className="bg-[#181818] p-3 rounded-lg hover:bg-[#222] transition-colors">
                        <img src={track.imageUrl || track.img} onError={handleImgError} alt={track.title} className="w-full aspect-square rounded-md mb-2 object-cover" />
                        <p className="text-white text-sm font-bold truncate">{track.title}</p>
                        <p className="text-gray-400 text-xs truncate">{track.artist}</p>
                    </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
