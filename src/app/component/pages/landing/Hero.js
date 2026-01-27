"use client";
import { ArrowRight, Music } from 'lucide-react';
import LivePulse from './LivePulse';
import GlobalTrends from './GlobalTrends';
import { useEffect, useState } from 'react';

// Static fallback data in case API fails
const FALLBACK_ARTISTS = [
  {
    rank: 1,
    artist: "Drake",
    title: "Rich Baby Daddy",
    days: 365,
    streams: 1500000000,
    streamsFormatted: "1.50B",
    imageUrl: "https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9",
  },
  {
    rank: 2,
    artist: "Taylor Swift",
    title: "Anti-Hero",
    days: 800,
    streams: 2100000000,
    streamsFormatted: "2.10B",
    imageUrl: "https://i.scdn.co/image/ab6761610000e5eb5a00969a4698c3132a15fbb0",
  },
  {
    rank: 3,
    artist: "The Weeknd",
    title: "Blinding Lights",
    days: 1500,
    streams: 4200000000,
    streamsFormatted: "4.20B",
    imageUrl: "https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb",
  },
];

export default function Hero({ onConnectClick }) {
  // Generate music notes only on client side to avoid hydration mismatch
  const [musicNotes, setMusicNotes] = useState([]);
  const [topArtists, setTopArtists] = useState(FALLBACK_ARTISTS);
  const [isLoading, setIsLoading] = useState(true);


  // Fetch top artists from KWORB API
  useEffect(() => {
    async function fetchTopArtists() {
      try {
        const response = await fetch('/api/landing/top-artist');
        const result = await response.json();

        if (result.success && result.data?.length >= 3) {
          setTopArtists(result.data.slice(0, 3));
        }
      } catch (error) {
        console.error('Failed to fetch top artists:', error);
        // Keep fallback data
      } finally {
        setIsLoading(false);
      }
    }

    fetchTopArtists();
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0D0D0D] pt-20">
      {/* Music Note Accents - Mapped from array */}
      {musicNotes.map((note) => (
        <div
          key={note.id}
          className={`absolute text-${note.size} animate-${note.animation}`}
          style={{
            [note.top ? 'top' : 'bottom']: note.top || note.bottom,
            [note.left ? 'left' : 'right']: note.left || note.right,
            color: note.color,
            opacity: note.opacity / 100,
          }}
        >
          {note.symbol}
        </div>
      ))}

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-12">
        {/* Hero Header - Asymmetric Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20 items-center">
          <div className="lg:col-span-7 space-y-8">
            {/* Main Headline */}
            <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-black leading-[0.9] text-white tracking-tighter animate-slide-in-left-delayed">
              <span className="block">Discover Your</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#1DB954] to-[#1ed760]">MUSIC STATS</span>
            </h1>

            {/* Description */}
            <p className="text-xl text-gray-400 max-w-xl leading-relaxed font-light animate-fade-in-delayed">
              Uncover hidden patterns in your listening habits with
              <span className="text-[#1DB954] font-semibold"> real-time analytics</span> that reveal your unique musical identity.
            </p>

            {/* CTA Button */}
            <div className="flex flex-wrap gap-4 animate-fade-in-delayed-2">
              <button
                onClick={onConnectClick}
                className="group relative px-10 py-5 bg-[#1DB954] text-black font-bold text-lg rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(29,185,84,0.6)]"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Connect Spotify
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={22} />
                </span>
                <div className="absolute inset-0 bg-[#1ed760] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          </div>

          {/* Top Artists Cards - Right Side - Card Fan Effect */}
          <div className="lg:col-span-5 animate-slide-in-right flex items-center justify-center">
            <div className="card-stack" style={{ position: 'relative', width: '380px', height: '580px' }}>
              {/* Right card - Rank 3 (rotates right) */}
              <div className="stack-card stack-card-1" style={{ position: 'absolute', top: 0, left: 0 }}>
                <ArtistRankCard
                  rank={topArtists[2]?.rank || 3}
                  artist={topArtists[2]?.artist || "Loading..."}
                  title={topArtists[2]?.title || ""}
                  days={topArtists[2]?.days || 0}
                  streams={topArtists[2]?.streamsFormatted || "0"}
                  imageUrl={topArtists[2]?.imageUrl}
                  isLoading={isLoading}
                />
              </div>
              {/* Left card - Rank 2 (rotates left) */}
              <div className="stack-card stack-card-2" style={{ position: 'absolute', top: 0, left: 0 }}>
                <ArtistRankCard
                  rank={topArtists[1]?.rank || 2}
                  artist={topArtists[1]?.artist || "Loading..."}
                  title={topArtists[1]?.title || ""}
                  days={topArtists[1]?.days || 0}
                  streams={topArtists[1]?.streamsFormatted || "0"}
                  imageUrl={topArtists[1]?.imageUrl}
                  isLoading={isLoading}
                />
              </div>
              {/* Front/Middle card - Rank 1 */}
              <div className="stack-card stack-card-3" style={{ position: 'absolute', top: 0, left: 0 }}>
                <ArtistRankCard
                  rank={topArtists[0]?.rank || 1}
                  artist={topArtists[0]?.artist || "Loading..."}
                  title={topArtists[0]?.title || ""}
                  days={topArtists[0]?.days || 0}
                  streams={topArtists[0]?.streamsFormatted || "0"}
                  imageUrl={topArtists[0]?.imageUrl}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Preview Section */}
        <div className="w-full mb-24">
          <div className="flex items-center gap-6 mb-12">
            <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="space-y-2 text-center">
              <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                Preview Dashboard
              </h3>
            </div>
            <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
          <LivePulse />
        </div>

        {/* Global Trends */}
        <div className="w-full mb-24">
          <GlobalTrends />
        </div>

        {/* Footer */}
        <footer className="w-full border-t border-white/10 py-8 mt-12">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>© 2024 SonicPulse. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </footer>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;700;900&display=swap');

        * {
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        h1, h2, h3, .font-black {
          font-family: 'Bebas Neue', 'DM Sans', sans-serif;
          letter-spacing: -0.02em;
        }

        /* Vinyl Record */
        .vinyl-record {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background:
            radial-gradient(circle at center, #1a1a1a 20%, transparent 20%),
            radial-gradient(circle at center, #2a2a2a 40%, transparent 40%),
            radial-gradient(circle at center, #1a1a1a 60%, transparent 60%),
            radial-gradient(circle at center, #2a2a2a 80%, transparent 80%),
            radial-gradient(circle at center, #0D0D0D 100%);
          box-shadow: inset 0 0 50px rgba(0,0,0,0.5);
          position: relative;
        }

        .vinyl-record::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 15%;
          height: 15%;
          background: #0D0D0D;
          border-radius: 50%;
          border: 2px solid #1a1a1a;
        }

        @keyframes spin-vinyl {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes spin-vinyl-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        .animate-spin-vinyl {
          animation: spin-vinyl 8s linear infinite;
        }

        .animate-spin-vinyl-reverse {
          animation: spin-vinyl-reverse 12s linear infinite;
        }

        /* Waveform Animations */
        @keyframes wave-flow {
          0% { stroke-dashoffset: 0; opacity: 0.3; }
          50% { opacity: 0.6; }
          100% { stroke-dashoffset: -1000; opacity: 0.3; }
        }

        .animate-wave-flow {
          stroke-dasharray: 500;
          animation: wave-flow 8s linear infinite;
        }

        .animate-wave-flow-delayed {
          stroke-dasharray: 500;
          animation: wave-flow 10s linear infinite;
          animation-delay: 1s;
        }

        .animate-wave-flow-slow {
          stroke-dasharray: 500;
          animation: wave-flow 12s linear infinite;
          animation-delay: 2s;
        }

        /* Floating Music Notes */
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.2; }
          50% { transform: translateY(-20px) rotate(5deg); opacity: 0.3; }
        }

        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.2; }
          50% { transform: translateY(-30px) rotate(-5deg); opacity: 0.3; }
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.2; }
          50% { transform: translateY(-15px) scale(1.1); opacity: 0.3; }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }

        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }

        @keyframes wave-pulse {
          0%, 100% { transform: scale(1) translateY(0); opacity: 0.1; }
          50% { transform: scale(1.1) translateY(-20px); opacity: 0.15; }
        }

        @keyframes wave-pulse-delayed {
          0%, 100% { transform: scale(1) translateX(0); opacity: 0.1; }
          50% { transform: scale(1.15) translateX(20px); opacity: 0.15; }
        }

        @keyframes wave-pulse-slow {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.08; }
          50% { transform: scale(1.2) rotate(10deg); opacity: 0.12; }
        }

        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .animate-wave-pulse {
          animation: wave-pulse 8s ease-in-out infinite;
        }

        .animate-wave-pulse-delayed {
          animation: wave-pulse-delayed 10s ease-in-out infinite;
        }

        .animate-wave-pulse-slow {
          animation: wave-pulse-slow 12s ease-in-out infinite;
        }

        .animate-slide-in-left {
          animation: slide-in-left 0.8s ease-out forwards;
        }

        .animate-slide-in-left-delayed {
          animation: slide-in-left 0.8s ease-out 0.2s forwards;
          opacity: 0;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.8s ease-out 0.3s forwards;
          opacity: 0;
        }

        .animate-fade-in-delayed {
          animation: fadeInUp 0.8s ease-out 0.4s forwards;
          opacity: 0;
        }

        .animate-fade-in-delayed-2 {
          animation: fadeInUp 0.8s ease-out 0.6s forwards;
          opacity: 0;
        }

        .animate-fade-in-delayed-3 {
          animation: fadeInUp 0.8s ease-out 0.8s forwards;
          opacity: 0;
        }

        .animate-fade-in-bar {
          animation: fadeInUp 0.5s ease-out forwards;
          opacity: 0;
        }

        .glitch-text {
          position: relative;
          display: inline-block;
        }

        .glitch-text:hover::before,
        .glitch-text:hover::after {
          content: attr(data-text);
          position: absolute;
          left: 0;
          top: 0;
        }

        .glitch-text:hover::before {
          animation: glitch-1 0.3s infinite;
          color: #FF006E;
          z-index: -1;
        }

        .glitch-text:hover::after {
          animation: glitch-2 0.3s infinite;
          color: #00F5FF;
          z-index: -2;
        }

        @keyframes glitch-1 {
          0%, 100% { transform: translate(0); }
          33% { transform: translate(-2px, 2px); }
          66% { transform: translate(2px, -2px); }
        }

        @keyframes glitch-2 {
          0%, 100% { transform: translate(0); }
          33% { transform: translate(2px, -2px); }
          66% { transform: translate(-2px, 2px); }
        }

        @keyframes scan {
          0% { background-position: 0 0; }
          100% { background-position: 0 100%; }
        }

        .animate-scan {
          animation: scan 8s linear infinite;
        }

        .perspective-1000 {
          perspective: 1000px;
        }

        /* Stacked Card Pile */
        .card-stack {
          position: relative;
          width: 280px;
          height: 480px;
        }

        .stack-card {
          position: absolute;
          top: 0;
          left: 0;
          width: 340px;
          transform-origin: center 700px;
          will-change: transform, opacity;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        /* Card 1 - Bottom (rotated right) */
        .stack-card-1 {
          z-index: 1;
          transform: rotate(6deg) translateZ(0);
          opacity: 0.6;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease;
        }

        /* Card 2 - Middle (rotated left) */
        .stack-card-2 {
          z-index: 2;
          transform: rotate(-4deg) translateZ(0);
          opacity: 0.8;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease;
        }

        /* Card 3 - Top (front, no rotation) */
        .stack-card-3 {
          z-index: 3;
          transform: rotate(0deg) translateZ(0);
          opacity: 1;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease;
        }

        /* Fan out on container hover */
        .card-stack:hover .stack-card-1 {
          transform: rotate(20deg) translateZ(0);
          opacity: 0.5;
        }

        .card-stack:hover .stack-card-2 {
          transform: rotate(-20deg) translateZ(0);
          opacity: 0.7;
        }

        .card-stack:hover .stack-card-3 {
          transform: rotate(0deg) scale(1.02) translateZ(0);
          opacity: 1;
        }

        /* Individual card hover - stay in fanned position but scale up */
        .card-stack:hover .stack-card-1:hover {
          z-index: 10;
          transform: rotate(20deg) scale(1.1) translateZ(0);
          opacity: 1;
        }

        .card-stack:hover .stack-card-2:hover {
          z-index: 10;
          transform: rotate(-20deg) scale(1.1) translateZ(0);
          opacity: 1;
        }

        .card-stack:hover .stack-card-3:hover {
          z-index: 10;
          transform: rotate(0deg) scale(1.1) translateZ(0);
          opacity: 1;
        }

        .stack-card:hover .card-shine {
          opacity: 1;
        }

        .stack-card:hover img {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}

// NFT Artist Card Component - CloneX Style with Card Fan Effect
function ArtistRankCard({ rank, artist, title, days, streams, imageUrl, isLoading }) {
  return (
    <div className="w-[340px]">
      {/* Glass Frame Container */}
      <div className="relative bg-gradient-to-br from-white/5 to-transparent backdrop-blur-md rounded-2xl p-[3px] shadow-2xl">

        {/* Chrome Corner Accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/40 rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/40 rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/40 rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/40 rounded-br-2xl" />

        {/* Inner Card */}
        <div className="relative bg-black rounded-2xl overflow-hidden">
          {/* Artist Image */}
          <div className="relative w-full h-[340px] overflow-hidden">
            {isLoading ? (
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse flex items-center justify-center">
                <Music size={48} className="text-gray-600" />
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt={artist}
                className="w-full h-full object-cover transition-transform duration-700"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            {/* Fallback when no image */}
            <div
              className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center absolute inset-0"
              style={{ display: imageUrl && !isLoading ? 'none' : 'flex' }}
            >
              <Music size={48} className="text-[#1DB954]" />
            </div>
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            {/* Rank Badge */}
            <div className="absolute top-3 left-3 w-10 h-10 bg-[#1DB954] rounded-full flex items-center justify-center">
              <span className="text-black font-black text-lg">#{rank}</span>
            </div>
          </div>

          {/* Bottom Metadata Bar */}
          <div className="relative bg-black p-4">
            {/* Artist Name */}
            <div className="flex items-center justify-between mb-2 text-[10px] text-gray-400 font-mono uppercase tracking-wider">
              <span>{artist}</span>
            </div>

            {/* Song Title */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-white font-bold text-xl tracking-tight mb-1 truncate max-w-[280px]">{title}</div>
              </div>
            </div>

            {/* Days and Streams */}
            <div className="flex items-center justify-between text-[10px] text-gray-500 uppercase tracking-wider">
              <span>{days} Days on Chart</span>
              <div className="flex items-center gap-2">
                <Music size={12} className="text-[#1DB954]" />
                <span className="text-[#1DB954] font-bold">{streams} STREAMS</span>
              </div>
            </div>
          </div>

          {/* Holographic Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0 opacity-0 transition-opacity duration-700 pointer-events-none mix-blend-overlay card-shine" />

          {/* Scan Lines */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="w-full h-full bg-gradient-to-b from-transparent via-white to-transparent bg-[length:100%_4px] animate-scan" />
          </div>
        </div>
      </div>

    </div>
  );
}

