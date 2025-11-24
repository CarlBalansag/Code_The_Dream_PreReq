"use client";
import { ArrowRight, Zap, TrendingUp, Radio } from 'lucide-react';
import LivePulse from './LivePulse';
import GlobalTrends from './GlobalTrends';
import { useEffect, useRef, useState } from 'react';

// Music notes configuration - Generate programmatically!
const generateMusicNotes = (count = 50) => {
  const symbols = ['♪', '♫', '♬', '♩'];
  const colors = ['#BFFF0B', '#FF006E', '#00F5FF'];
  const sizes = ['4xl', '5xl', '6xl', '7xl', '8xl', '9xl'];
  const animations = ['float', 'float-delayed', 'float-slow'];

  return Array.from({ length: count }, (_, i) => {
    const useTop = Math.random() > 0.5;
    const useLeft = Math.random() > 0.5;

    return {
      id: i + 1,
      symbol: symbols[i % symbols.length],
      [useTop ? 'top' : 'bottom']: `${Math.floor(Math.random() * 96) + 2}%`,
      [useLeft ? 'left' : 'right']: `${Math.floor(Math.random() * 96) + 2}%`,
      color: colors[i % colors.length],
      opacity: 1, // Fixed opacity - change this number to adjust (3 = 0.03 transparency)
      size: sizes[Math.floor(Math.random() * sizes.length)],
      animation: animations[i % animations.length],
    };
  });
};

export default function Hero({ onConnectClick }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);
  // Generate music notes only on client side to avoid hydration mismatch
  const [musicNotes] = useState(() => generateMusicNotes(50)); // Change the number here to add/remove notes!

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePos({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={heroRef} className="relative min-h-screen w-full overflow-hidden bg-[#0D0D0D] pt-20">
      {/* Animated Vinyl Records Background */}
      <div className="absolute top-20 right-[5%] w-[500px] h-[500px] opacity-4 pointer-events-none">
        <div className="vinyl-record animate-spin-vinyl" />
      </div>
      <div className="absolute bottom-32 left-[10%] w-[350px] h-[350px] opacity-5 pointer-events-none">
        <div className="vinyl-record animate-spin-vinyl-reverse" />
      </div>

      {/* Audio Waveform Lines */}
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
        <svg className="absolute w-full h-full" style={{
          transform: `translateY(${mousePos.y * 30}px)`,
          transition: 'transform 0.5s ease-out',
        }}>
          <path d="M0,250 Q250,200 500,250 T1000,250 T1500,250 T2000,250" stroke="#BFFF0B" strokeWidth="2" fill="none" className="animate-wave-flow" />
          <path d="M0,350 Q250,300 500,350 T1000,350 T1500,350 T2000,350" stroke="#FF006E" strokeWidth="2" fill="none" className="animate-wave-flow-delayed" />
          <path d="M0,450 Q250,400 500,450 T1000,450 T1500,450 T2000,450" stroke="#00F5FF" strokeWidth="2" fill="none" className="animate-wave-flow-slow" />
        </svg>
      </div>

      {/* Sound Wave Orbs */}
      <div className="absolute top-20 left-[10%] w-[600px] h-[600px] bg-[#BFFF0B] opacity-10 blur-[150px] rounded-full animate-wave-pulse" />
      <div className="absolute top-40 right-[15%] w-[500px] h-[500px] bg-[#FF006E] opacity-10 blur-[140px] rounded-full animate-wave-pulse-delayed" />
      <div className="absolute bottom-20 left-[30%] w-[400px] h-[400px] bg-[#00F5FF] opacity-10 blur-[130px] rounded-full animate-wave-pulse-slow" />

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
            {/* Eyebrow */}
            <div className="flex items-center gap-3 animate-slide-in-left">
              <div className="h-[2px] w-12 bg-gradient-to-r from-[#BFFF0B] to-transparent" />
              <span className="text-[#BFFF0B] text-sm font-bold tracking-[0.3em] uppercase">
                Real-Time Analytics
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-6xl md:text-8xl font-black leading-[0.9] text-white tracking-tight animate-slide-in-left-delayed">
              <span className="block">YOUR</span>
              <span className="block text-[#BFFF0B] glitch-text" data-text="SONIC">MUSIC</span>
              <span className="block">IDENTITY</span>
            </h1>

            {/* Description */}
            <p className="text-xl text-gray-400 max-w-xl leading-relaxed font-light animate-fade-in-delayed">
              Break through the noise. Visualize your music DNA with
              <span className="text-[#00F5FF] font-semibold"> hyper-granular analytics</span> that reveal
              patterns you never knew existed.
            </p>

            {/* CTA Button */}
            <div className="flex flex-wrap gap-4 animate-fade-in-delayed-2">
              <button
                onClick={onConnectClick}
                className="group relative px-8 py-5 bg-[#BFFF0B] text-black font-bold text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(191,255,11,0.4)]"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Connect Spotify
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={22} />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF006E] to-[#00F5FF] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>

            {/* Stats Bar */}
            <div className="flex flex-wrap gap-8 pt-8 border-t border-white/10 animate-fade-in-delayed-3">
              <div className="space-y-1">
                <div className="text-3xl font-black text-[#BFFF0B]">47K+</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Active Users</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-[#FF006E]">2.3M+</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Tracks Analyzed</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-[#00F5FF]">99.9%</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Accuracy</div>
              </div>
            </div>
          </div>

          {/* Feature Cards - Right Side */}
          <div className="lg:col-span-5 space-y-4 animate-slide-in-right">
            <FeatureCard
              icon={<Zap className="text-[#BFFF0B]" size={24} />}
              title="Real-Time Tracking"
              description="Every play, every artist, captured instantly"
              delay="0s"
            />
            <FeatureCard
              icon={<TrendingUp className="text-[#FF006E]" size={24} />}
              title="Deep Analytics"
              description="Uncover hidden patterns in your listening"
              delay="0.1s"
            />
            <FeatureCard
              icon={<Radio className="text-[#00F5FF]" size={24} />}
              title="Global Trends"
              description="See what the world is streaming now"
              delay="0.2s"
            />
          </div>
        </div>

        {/* Dashboard Preview Section */}
        <div className="w-full mb-24">
          <div className="flex items-center gap-6 mb-12">
            <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="space-y-2 text-center">
              <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                YOUR COMMAND CENTER
              </h3>
              <p className="text-sm text-gray-500 uppercase tracking-[0.3em]">
                Preview Dashboard
              </p>
            </div>
            <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
          <LivePulse />
        </div>

        {/* Global Trends */}
        <div className="w-full mb-24">
          <GlobalTrends />
        </div>

        {/* Final CTA - Brutalist Box */}
        <div className="relative w-full bg-gradient-to-br from-[#1a1a1a] to-[#0D0D0D] border-4 border-[#BFFF0B] p-12 md:p-16">
          <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-[#FF006E]" />
          <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-[#00F5FF]" />

          <div className="relative z-10 text-center space-y-6 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
              READY TO <span className="text-[#BFFF0B]">DECODE</span><br />
              YOUR MUSIC DNA?
            </h2>
            <p className="text-lg text-gray-400 font-light">
              Join the movement of music lovers who track every beat, every moment
            </p>
            <button
              onClick={onConnectClick}
              className="group relative px-12 py-6 bg-white text-black font-black text-xl overflow-hidden hover:scale-105 transition-all hover:shadow-[0_0_60px_rgba(255,255,255,0.3)]"
            >
              <span className="relative z-10 flex items-center gap-3 justify-center">
                Launch Dashboard
                <ArrowRight className="group-hover:translate-x-2 transition-transform" size={24} />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#BFFF0B] via-[#FF006E] to-[#00F5FF] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </button>
          </div>
        </div>
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
      `}</style>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description, delay }) {
  return (
    <div
      className="group relative bg-[#1a1a1a] border-2 border-white/10 p-6 hover:border-[#BFFF0B] transition-all duration-300 hover:translate-x-2"
      style={{ animationDelay: delay }}
    >
      <div className="absolute top-0 left-0 w-1 h-0 bg-[#BFFF0B] group-hover:h-full transition-all duration-300" />
      <div className="flex items-start gap-4">
        <div className="p-3 bg-white/5 group-hover:bg-white/10 transition-colors">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-bold text-white mb-1">{title}</h4>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
}
