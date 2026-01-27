"use client";
import { useEffect, useState, useRef } from 'react';
import { Disc, BarChart2, Clock } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { MOCK_TOP_ARTISTS, MOCK_RECENT_TRACKS, MOCK_TOP_TRACKS_LIST } from './constants';

// Typewriter component with backspace effect
function TypewriterText({ text, speed = 30 }) {
  const [displayText, setDisplayText] = useState(text);
  const [isFirstRender, setIsFirstRender] = useState(true);
  const previousText = useRef(text);

  useEffect(() => {
    // Skip animation on first render
    if (isFirstRender) {
      setIsFirstRender(false);
      setDisplayText(text);
      previousText.current = text;
      return;
    }

    // If text hasn't changed, do nothing
    if (text === previousText.current) return;

    let isCancelled = false;
    const oldText = previousText.current;
    previousText.current = text;

    // Backspace animation
    const backspace = async () => {
      for (let i = oldText.length; i >= 0; i--) {
        if (isCancelled) return;
        setDisplayText(oldText.slice(0, i));
        await new Promise(resolve => setTimeout(resolve, speed));
      }
    };

    // Type animation
    const typeText = async () => {
      for (let i = 0; i <= text.length; i++) {
        if (isCancelled) return;
        setDisplayText(text.slice(0, i));
        await new Promise(resolve => setTimeout(resolve, speed));
      }
    };

    // Run backspace then type
    const animate = async () => {
      await backspace();
      if (!isCancelled) {
        await typeText();
      }
    };

    animate();

    return () => {
      isCancelled = true;
    };
  }, [text, speed, isFirstRender]);

  return <span>{displayText}</span>;
}

const FALLBACK_IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%231DB954"/><text x="50" y="54" font-size="36" text-anchor="middle" fill="black" font-family="Arial, sans-serif">&#9835;</text></svg>';

// Static chart data for each artist - realistic listening patterns
const ARTIST_CHART_DATA = {
  'Frank Ocean': {
    '7 Days': [
      { day: 'Mon', plays: 12 },
      { day: 'Tue', plays: 18 },
      { day: 'Wed', plays: 15 },
      { day: 'Thu', plays: 22 },
      { day: 'Fri', plays: 35 },
      { day: 'Sat', plays: 42 },
      { day: 'Sun', plays: 28 }
    ],
    '1 Month': [
      { day: 'Week 1', plays: 85 },
      { day: 'Week 2', plays: 112 },
      { day: 'Week 3', plays: 98 },
      { day: 'Week 4', plays: 145 },
      { day: 'Week 5', plays: 124 }
    ],
    'All Time': [
      { day: '2020', plays: 342 },
      { day: '2021', plays: 518 },
      { day: '2022', plays: 445 },
      { day: '2023', plays: 623 },
      { day: '2024', plays: 487 }
    ]
  },
  'Taylor Swift': {
    '7 Days': [
      { day: 'Mon', plays: 8 },
      { day: 'Tue', plays: 14 },
      { day: 'Wed', plays: 22 },
      { day: 'Thu', plays: 18 },
      { day: 'Fri', plays: 28 },
      { day: 'Sat', plays: 38 },
      { day: 'Sun', plays: 32 }
    ],
    '1 Month': [
      { day: 'Week 1', plays: 72 },
      { day: 'Week 2', plays: 95 },
      { day: 'Week 3', plays: 128 },
      { day: 'Week 4', plays: 108 },
      { day: 'Week 5', plays: 142 }
    ],
    'All Time': [
      { day: '2020', plays: 287 },
      { day: '2021', plays: 412 },
      { day: '2022', plays: 534 },
      { day: '2023', plays: 478 },
      { day: '2024', plays: 562 }
    ]
  },
  'Bruno Mars': {
    '7 Days': [
      { day: 'Mon', plays: 15 },
      { day: 'Tue', plays: 12 },
      { day: 'Wed', plays: 18 },
      { day: 'Thu', plays: 25 },
      { day: 'Fri', plays: 32 },
      { day: 'Sat', plays: 45 },
      { day: 'Sun', plays: 38 }
    ],
    '1 Month': [
      { day: 'Week 1', plays: 95 },
      { day: 'Week 2', plays: 78 },
      { day: 'Week 3', plays: 112 },
      { day: 'Week 4', plays: 135 },
      { day: 'Week 5', plays: 118 }
    ],
    'All Time': [
      { day: '2020', plays: 219 },
      { day: '2021', plays: 356 },
      { day: '2022', plays: 298 },
      { day: '2023', plays: 425 },
      { day: '2024', plays: 512 }
    ]
  },
  'SZA': {
    '7 Days': [
      { day: 'Mon', plays: 18 },
      { day: 'Tue', plays: 24 },
      { day: 'Wed', plays: 20 },
      { day: 'Thu', plays: 16 },
      { day: 'Fri', plays: 28 },
      { day: 'Sat', plays: 35 },
      { day: 'Sun', plays: 30 }
    ],
    '1 Month': [
      { day: 'Week 1', plays: 88 },
      { day: 'Week 2', plays: 102 },
      { day: 'Week 3', plays: 85 },
      { day: 'Week 4', plays: 118 },
      { day: 'Week 5', plays: 95 }
    ],
    'All Time': [
      { day: '2020', plays: 186 },
      { day: '2021', plays: 245 },
      { day: '2022', plays: 312 },
      { day: '2023', plays: 498 },
      { day: '2024', plays: 425 }
    ]
  },
  'Drake': {
    '7 Days': [
      { day: 'Mon', plays: 10 },
      { day: 'Tue', plays: 16 },
      { day: 'Wed', plays: 14 },
      { day: 'Thu', plays: 20 },
      { day: 'Fri', plays: 38 },
      { day: 'Sat', plays: 48 },
      { day: 'Sun', plays: 35 }
    ],
    '1 Month': [
      { day: 'Week 1', plays: 92 },
      { day: 'Week 2', plays: 125 },
      { day: 'Week 3', plays: 108 },
      { day: 'Week 4', plays: 142 },
      { day: 'Week 5', plays: 115 }
    ],
    'All Time': [
      { day: '2020', plays: 164 },
      { day: '2021', plays: 298 },
      { day: '2022', plays: 385 },
      { day: '2023', plays: 456 },
      { day: '2024', plays: 378 }
    ]
  }
};

// Default chart data for unknown artists
const DEFAULT_CHART_DATA = {
  '7 Days': [
    { day: 'Mon', plays: 12 },
    { day: 'Tue', plays: 18 },
    { day: 'Wed', plays: 16 },
    { day: 'Thu', plays: 22 },
    { day: 'Fri', plays: 30 },
    { day: 'Sat', plays: 40 },
    { day: 'Sun', plays: 32 }
  ],
  '1 Month': [
    { day: 'Week 1', plays: 85 },
    { day: 'Week 2', plays: 98 },
    { day: 'Week 3', plays: 92 },
    { day: 'Week 4', plays: 125 },
    { day: 'Week 5', plays: 108 }
  ],
  'All Time': [
    { day: '2020', plays: 245 },
    { day: '2021', plays: 365 },
    { day: '2022', plays: 312 },
    { day: '2023', plays: 458 },
    { day: '2024', plays: 425 }
  ]
};

// Get chart data for an artist
function getArtistChartData(artistName, range) {
  const artistData = ARTIST_CHART_DATA[artistName];
  if (artistData && artistData[range]) {
    return artistData[range];
  }
  return DEFAULT_CHART_DATA[range];
}

export default function LivePulse() {
  const [deepDiveRange, setDeepDiveRange] = useState('1 Month');
  const [imageErrors, setImageErrors] = useState(new Set());
  const [artists, setArtists] = useState(MOCK_TOP_ARTISTS);
  const [selectedArtistIndex, setSelectedArtistIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const tracks = MOCK_TOP_TRACKS_LIST;

  // Fetch real artist images from Spotify API
  useEffect(() => {
    async function fetchArtistImages() {
      try {
        const response = await fetch('/api/landing/artist-images');
        const result = await response.json();

        if (result.success && result.data?.length > 0) {
          setArtists(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch artist images:', error);
        // Keep fallback mock data
      }
    }

    fetchArtistImages();
  }, []);

  const selectedArtist = artists[selectedArtistIndex] || artists[0];
  const chartData = getArtistChartData(selectedArtist?.name || 'Artist', deepDiveRange);

  // State for managing the displayed image during transition
  const [displayedImageUrl, setDisplayedImageUrl] = useState(null);

  // Update displayed image when selected artist changes (after transition)
  useEffect(() => {
    if (!isTransitioning && selectedArtist?.imageUrl) {
      setDisplayedImageUrl(selectedArtist.imageUrl);
    }
  }, [selectedArtist?.imageUrl, isTransitioning]);

  // Initialize displayed image
  useEffect(() => {
    if (selectedArtist?.imageUrl && !displayedImageUrl) {
      setDisplayedImageUrl(selectedArtist.imageUrl);
    }
  }, [selectedArtist?.imageUrl, displayedImageUrl]);

  // Handle artist selection with smooth transition
  const handleArtistClick = (index) => {
    if (index === selectedArtistIndex) return;
    setIsTransitioning(true);
    // After scale down animation (300ms), update the image and start scale up
    setTimeout(() => {
      setSelectedArtistIndex(index);
      // Small delay to allow React to update the image source
      setTimeout(() => setIsTransitioning(false), 50);
    }, 300);
  };

  const handleImgError = (e, identifier) => {
    const target = e?.target;
    if (target && !imageErrors.has(identifier)) {
      console.log('Image failed to load:', identifier, target.src);
      setImageErrors(prev => new Set(prev).add(identifier));
      target.onerror = null;
      target.src = FALLBACK_IMG;
    }
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto perspective-1000 animate-fade-in-up">
      <div className="relative glass-panel rounded-xl border border-white/10 shadow-2xl overflow-hidden bg-[#0a0a0a]/90 backdrop-blur-xl">
        {/* Header */}
        <div className="h-10 bg-white/5 border-b border-white/5 flex items-center justify-between px-4 sticky top-0 z-50 backdrop-blur-md">
          <div className="flex gap-1.5 group">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] group-hover:scale-110 transition-transform"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] group-hover:scale-110 transition-transform"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F] group-hover:scale-110 transition-transform"></div>
          </div>

          <div className="w-12"></div>
        </div>

        <div className="p-5 md:p-8 flex flex-col gap-8">
          <div className="flex justify-between items-end border-b border-white/5 pb-4 animate-fade-in-up delay-100">
            <div><h2 className="text-2xl font-bold text-white mb-1">Good Evening</h2></div>
            <div className="flex items-center gap-1"><p className="text-[10px] text-spotify font-bold uppercase tracking-widest">Live Tracking Active</p></div>
          </div>

          {/* Top Artists */}
          <div className="relative animate-fade-in-up delay-200">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Disc className="text-spotify" size={18}/> Your Top Artists</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {artists.slice(0, 5).map((artist, index) => (
                <div
                  key={artist.id || `${artist.name}-${index}`}
                  onClick={() => handleArtistClick(index)}
                  className={`bg-[#181818] p-4 rounded-xl border flex flex-col items-center transition-all cursor-pointer ${
                    selectedArtistIndex === index
                      ? 'border-spotify ring-2 ring-spotify/30 scale-[1.02]'
                      : 'border-white/5 hover:border-spotify/50'
                  }`}
                >
                    <img
                      src={artist.imageUrl || artist.img || FALLBACK_IMG}
                      onError={(e) => handleImgError(e, `artist-${artist.id}`)}
                      alt={artist.name}
                      className={`w-20 h-20 rounded-full mb-3 object-cover transition-all ${
                        selectedArtistIndex === index ? 'ring-2 ring-spotify' : ''
                      }`}
                      crossOrigin="anonymous"
                    />
                    <h3 className="text-white font-bold text-sm">{artist.name}</h3>
                    <span className={`text-[10px] ${selectedArtistIndex === index ? 'text-spotify' : 'text-gray-400'}`}>
                      #{index + 1} Ranked
                    </span>
                </div>
            ))}
            </div>
          </div>

          {/* Deep Dive Chart */}
          <div className="bg-gradient-to-br from-[#121212] to-[#0d0d0d] rounded-xl p-6 border border-white/10 animate-fade-in-up delay-300">
            <div className="flex justify-between mb-6">
                <div className="flex gap-4 items-center">
                    <div className="relative">
                      {/* Border - fades with image */}
                      <div
                        className="absolute -inset-[2px] rounded-full border border-spotify"
                        style={{
                          transform: isTransitioning ? 'scale(0.8)' : 'scale(1)',
                          opacity: isTransitioning ? 0 : 1,
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      />
                      <img
                        src={displayedImageUrl || selectedArtist?.imageUrl || FALLBACK_IMG}
                        onError={(e) => handleImgError(e, 'featured-artist')}
                        alt={selectedArtist?.name || 'Artist'}
                        className="w-14 h-14 rounded-full object-cover relative z-10"
                        style={{
                          transform: isTransitioning ? 'scale(0.8)' : 'scale(1)',
                          opacity: isTransitioning ? 0 : 1,
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                        crossOrigin="anonymous"
                      />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white min-w-[200px]">
                        <TypewriterText text={selectedArtist?.name || 'Top Artist'} speed={30} />
                      </h2>
                    </div>
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
                        <linearGradient id="cArtist" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1DB954" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#1DB954" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#333" vertical={false} opacity={0.5} />
                      <XAxis
                        dataKey="day"
                        stroke="#666"
                        tick={{ fill: '#999', fontSize: 12 }}
                        axisLine={{ stroke: '#333' }}
                      />
                      <YAxis
                        stroke="#666"
                        tick={{ fill: '#999', fontSize: 12 }}
                        axisLine={{ stroke: '#333' }}
                        label={{ value: 'Plays', angle: -90, position: 'insideLeft', fill: '#999' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#181818',
                          border: '1px solid #333',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        labelStyle={{ color: '#1DB954' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="plays"
                        stroke="#1DB954"
                        fill="url(#cArtist)"
                        strokeWidth={2}
                        isAnimationActive={true}
                        animationDuration={500}
                        animationEasing="ease-in-out"
                      />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
          </div>

          {/* Top Tracks */}
          <div className="animate-fade-in-up delay-500">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><BarChart2 className="text-spotify" size={18}/> Your Top Tracks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#121212] p-4 rounded-xl border border-white/5">
                {tracks.slice(0, 4).map((track, index) => (
                    <div key={track.id || track.rank || `${track.title}-${index}`} className="flex items-center p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <span className="w-6 text-white/50 font-mono">{track.rank}</span>
                        <img
                          src={track.imageUrl}
                          onError={(e) => handleImgError(e, `track-${track.rank}`)}
                          alt={track.title}
                          className="w-10 h-10 rounded mr-3 object-cover"
                          crossOrigin="anonymous"
                        />
                        <div className="flex-1">
                          <h4 className="text-white text-sm font-bold">{track.title}</h4>
                          <p className="text-gray-400 text-xs">{track.artist}</p>
                        </div>
                        <span className="text-xs text-gray-500">{track.plays}</span>
                    </div>
                ))}
            </div>
          </div>

          {/* Recently Played */}
          <div className="animate-fade-in-up delay-700">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Clock className="text-spotify" size={18}/> Recently Played</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {MOCK_RECENT_TRACKS.slice(0, 4).map((track, index) => (
                    <div key={track.id} className="bg-[#181818] p-3 rounded-lg hover:bg-[#222] transition-colors">
                        <img
                          src={track.imageUrl}
                          onError={(e) => handleImgError(e, `recent-${track.id}`)}
                          alt={track.title}
                          className="w-full aspect-square rounded-md mb-2 object-cover"
                          crossOrigin="anonymous"
                        />
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
