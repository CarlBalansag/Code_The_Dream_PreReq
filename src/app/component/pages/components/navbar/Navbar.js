"use client";
import { useState, useRef, useEffect } from "react";
import { Search, Menu, X } from "lucide-react";
import { useSpotifySearch } from '@/hooks/useSpotifySearch';
import SearchResultsDropdown from '@/app/component/pages/search/SearchResultsDropdown';

export default function Navbar({
  tourButton,
  profileDropdown,
  accessToken,
  userId,
  onArtistClick,
  onTrackClick,
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Refs for desktop and mobile search containers
  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  // Use the custom search hook
  const { results, loading, error, search, clearResults } = useSpotifySearch(accessToken);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.length >= 1) {
      search(value);
      setShowResults(true);
    } else {
      clearResults();
      setShowResults(false);
    }
  };

  // Handle search input focus
  const handleFocus = () => {
    if (searchQuery.length >= 1) {
      setShowResults(true);
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        desktopSearchRef.current &&
        !desktopSearchRef.current.contains(event.target) &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(event.target)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown handler
  const handleCloseDropdown = () => {
    setShowResults(false);
  };

  return (
    <>
      {/* Desktop Navbar - Fixed at top for screens >= 1024px */}
      <nav className="hidden lg:block fixed top-0 left-0 right-0 z-50 bg-[rgba(10,10,10,0.95)] backdrop-blur-md border-b border-[rgba(255,255,255,0.1)]">
        <div className="w-full px-10 py-4 flex items-center justify-between">
          {/* Left side - Navigation buttons */}
          <div className="flex items-center gap-4">
            <button className="px-6 py-2 bg-[#1db954] text-black font-semibold rounded-full hover:bg-[#1ed760] transition-colors">
              My Music
            </button>
            <button className="px-6 py-2 bg-transparent text-[#b3b3b3] font-semibold rounded-full hover:text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors">
              Everyone's Listening
            </button>
          </div>

          {/* Right side - Search bar + Tour button + Profile */}
          <div className="flex items-center gap-4">
            {/* Search bar */}
            <div className="relative w-80" ref={desktopSearchRef}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b3b3b3]" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleFocus}
                placeholder="Search for songs, artists..."
                className="w-full bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] rounded-full py-2.5 pl-12 pr-4 text-white placeholder-[#b3b3b3] focus:outline-none focus:border-[#1db954] focus:bg-[rgba(255,255,255,0.15)] transition-all"
              />
              {showResults && (
                <SearchResultsDropdown
                  results={results}
                  loading={loading}
                  onArtistClick={onArtistClick}
                  onTrackClick={onTrackClick}
                  onClose={handleCloseDropdown}
                />
              )}
            </div>

            {/* Tour button (passed from parent) */}
            {tourButton}

            {/* Profile dropdown (passed from parent) */}
            {profileDropdown}
          </div>
        </div>
      </nav>

      {/* Mobile - Fixed search bar + hamburger menu for screens < 1024px */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[rgba(10,10,10,0.95)] backdrop-blur-md border-b border-[rgba(255,255,255,0.1)]">
        <div className="px-4 py-3 flex items-center gap-3">
          {/* Hamburger menu button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-[rgba(255,255,255,0.1)] rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="text-white" size={24} />
          </button>

          {/* Search bar */}
          <div className="relative flex-1" ref={mobileSearchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b3b3b3]" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleFocus}
              placeholder="Search..."
              className="w-full bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder-[#b3b3b3] focus:outline-none focus:border-[#1db954] focus:bg-[rgba(255,255,255,0.15)] transition-all"
            />
            {showResults && (
              <SearchResultsDropdown
                results={results}
                loading={loading}
                onArtistClick={onArtistClick}
                onTrackClick={onTrackClick}
                onClose={handleCloseDropdown}
              />
            )}
          </div>

          {/* Tour button + Profile on mobile (passed from parent) */}
          <div className="flex items-center gap-2">
            {tourButton}
            {profileDropdown}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <>
          {/* Dark overlay */}
          <div
            className="lg:hidden fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Sidebar panel */}
          <div className="lg:hidden fixed top-0 left-0 bottom-0 z-[70] w-64 bg-[#0a0a0a] border-r border-[rgba(255,255,255,0.1)] animate-slide-in">
            {/* Sidebar header */}
            <div className="p-4 border-b border-[rgba(255,255,255,0.1)] flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">Menu</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-[rgba(255,255,255,0.1)] rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X className="text-white" size={20} />
              </button>
            </div>

            {/* Sidebar navigation */}
            <div className="p-4 space-y-2">
              <button className="w-full px-6 py-3 bg-[#1db954] text-black font-semibold rounded-lg hover:bg-[#1ed760] transition-colors text-left">
                My Music
              </button>
              <button className="w-full px-6 py-3 bg-transparent text-[#b3b3b3] font-semibold rounded-lg hover:text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors text-left">
                Everyone's Listening
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
