"use client";
import { ArrowRight, Music } from 'lucide-react';
import LivePulse from './LivePulse';
import GlobalTrends from './GlobalTrends';
import ShinyText from './ShinyText';
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
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0D0D0D] pt-16 sm:pt-20">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 md:pt-16 pb-8 sm:pb-12">
        {/* Hero Header - Asymmetric Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 mb-12 sm:mb-16 md:mb-20 items-center" id="TOP">
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[10rem] font-black leading-[0.9] text-white tracking-tighter animate-slide-in-left-delayed">
              <span className="block">Discover Your</span>
              <span className="block">
                <ShinyText
                  text="MUSIC"
                  baseColor="#1DB954"
                  shineColor="#a8f0c6"
                  speed={13}
                />
              </span>
              <span className="block">
                <ShinyText
                  text="STATS"
                  baseColor="#1DB954"
                  shineColor="#a8f0c6"
                  speed={13}
                />
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light animate-fade-in-delayed">
              Uncover hidden patterns in your listening habits with
              <span className="text-[#1DB954] font-semibold"> real-time analytics</span> that reveal your unique musical identity.
            </p>

            {/* CTA Button */}
            <div className="flex flex-wrap gap-4 animate-fade-in-delayed-2 justify-center lg:justify-start">
              <button
                onClick={onConnectClick}
                className="group relative px-6 py-3 sm:px-8 sm:py-4 md:px-10 md:py-5 bg-[#1DB954] text-black font-bold text-sm sm:text-base md:text-lg rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(29,185,84,0.6)]"
              >
                <span className="relative z-10 flex items-center gap-2 sm:gap-3">
                  Connect Spotify
                  <ArrowRight className="group-hover:translate-x-1 transition-transform w-4 h-4 sm:w-5 sm:h-5 md:w-[22px] md:h-[22px]" />
                </span>
                <div className="absolute inset-0 bg-[#1ed760] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          </div>

          {/* Top Artists Cards - Right Side - Card Fan Effect */}
          <div className="lg:col-span-5 animate-slide-in-right flex items-center justify-center mt-8 lg:mt-0">
            <div className="card-stack" style={{ position: 'relative' }}>
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
        <div className="w-full mb-12 sm:mb-16 md:mb-24" id="MIDDLE">
          <div className="flex items-center gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 md:mb-12">
            <div className="flex-1 h-[1px] sm:h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="space-y-2 text-center">
              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">
                Preview Dashboard
              </h3>
            </div>
            <div className="flex-1 h-[1px] sm:h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
          <LivePulse />
        </div>

        {/* Global Trends */}
        <div className="w-full mb-12 sm:mb-16 md:mb-24" id="BOTTOM">
          <GlobalTrends />
        </div>

        {/* Footer */}
        <footer className="w-full border-t border-white/10 py-8 sm:py-12 mt-8 sm:mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center gap-6">
            {/* Navigation Links */}
            <div className="flex gap-8 sm:gap-12 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">About</a>
              <a href="#" className="hover:text-white transition-colors">Features</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
            {/* Social Icons */}
            <div className="flex gap-4 text-gray-500">
              <a href="#" className="hover:text-white transition-colors" aria-label="X (Twitter)">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className="hover:text-white transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="#" className="hover:text-white transition-colors" aria-label="LinkedIn">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="#" className="hover:text-white transition-colors" aria-label="GitHub">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
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

        /* Stacked Card Pile - Responsive */
        .card-stack {
          position: relative;
          width: 200px;
          height: 340px;
        }

        @media (min-width: 400px) {
          .card-stack {
            width: 240px;
            height: 400px;
          }
        }

        @media (min-width: 640px) {
          .card-stack {
            width: 280px;
            height: 480px;
          }
        }

        @media (min-width: 1024px) {
          .card-stack {
            width: 320px;
            height: 520px;
          }
        }

        @media (min-width: 1280px) {
          .card-stack {
            width: 340px;
            height: 560px;
          }
        }

        .stack-card {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
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
    <div className="w-full">
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
          <div className="relative w-full aspect-square overflow-hidden">
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
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-[#1DB954] rounded-full flex items-center justify-center">
              <span className="text-black font-black text-xs sm:text-sm md:text-lg">#{rank}</span>
            </div>
          </div>

          {/* Bottom Metadata Bar */}
          <div className="relative bg-black p-2 sm:p-3 md:p-4">
            {/* Artist Name */}
            <div className="flex items-center justify-between mb-1 sm:mb-2 text-[8px] sm:text-[9px] md:text-[10px] text-gray-400 font-mono uppercase tracking-wider">
              <span className="truncate">{artist}</span>
            </div>

            {/* Song Title */}
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-full">
                <div className="text-white font-bold text-sm sm:text-base md:text-xl tracking-tight mb-1 truncate">{title}</div>
              </div>
            </div>

            {/* Days and Streams */}
            <div className="flex items-center justify-between text-[7px] sm:text-[8px] md:text-[10px] text-gray-500 uppercase tracking-wider">
              <span className="hidden xs:inline">{days} Days on Chart</span>
              <span className="xs:hidden">{days}d</span>
              <div className="flex items-center gap-1 sm:gap-2">
                <Music className="w-2 h-2 sm:w-3 sm:h-3 text-[#1DB954]" />
                <span className="text-[#1DB954] font-bold">{streams}</span>
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
