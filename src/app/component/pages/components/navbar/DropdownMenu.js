"use client";
import Image from 'next/image';
import { useState, useRef, useEffect } from "react";
import { spotifyLogOut } from './spotifyLogout';
import { CirclePlus } from 'lucide-react';
import ImportDataModal from './ImportDataModal';

export default function DropdownMenu({ ProfilePicture, UserName, UserProduct, accessToken, onDisconnect, userId }) {
  const [open, setOpen] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [backgroundTracking, setBackgroundTracking] = useState(true);
  const [isLoadingTracking, setIsLoadingTracking] = useState(true);
  const dropdownRef = useRef();

  // Fetch initial background tracking status
  useEffect(() => {
    if (!userId) return;

    const fetchTrackingStatus = async () => {
      try {
        const res = await fetch(`/api/user/background-tracking?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setBackgroundTracking(data.enabled);
        }
      } catch (error) {
        console.error('Failed to fetch background tracking status:', error);
      } finally {
        setIsLoadingTracking(false);
      }
    };

    fetchTrackingStatus();
  }, [userId]);

  // Toggle background tracking
  const toggleBackgroundTracking = async () => {
    const newValue = !backgroundTracking;
    setBackgroundTracking(newValue);

    try {
      const res = await fetch('/api/user/background-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, enabled: newValue }),
      });

      if (!res.ok) {
        // Revert on error
        setBackgroundTracking(!newValue);
        console.error('Failed to update background tracking');
      }
    } catch (error) {
      // Revert on error
      setBackgroundTracking(!newValue);
      console.error('Failed to update background tracking:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-flex" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="User menu"
        className="relative w-10 h-10 rounded-full focus:ring-2 focus:ring-[#1DB954] focus:outline-none"
      >
        <Image
          src={ProfilePicture || "/blank_pfp.png"}
          alt="Profile"
          fill
          className="rounded-full object-cover"
        />
      </button>

      {open && (
        <div className="absolute right-0 z-10 min-w-40 mt-16 bg-white shadow-md rounded-lg dark:bg-neutral-800 dark:border dark:border-neutral-700">
          <div className="py-3 px-4 border-b border-gray-200 dark:border-neutral-700">
            <p className="mb-1 text-sm text-gray-500 dark:text-neutral-400 text-center">Signed in as</p>
            <p className="mb-1 text-sm font-medium text-gray-800 dark:text-neutral-300 text-center">{UserName}</p>
            {UserProduct === "premium"
              ? <p className="text-sm font-medium text-gray-800 dark:text-neutral-300 text-center">Premium Member</p>
              : <p className="text-sm font-medium text-gray-800 dark:text-neutral-300 text-center">Free Member</p>
            }
          </div>

          <div className="p-1 space-y-0.5">
            {/* Background Tracking Toggle */}
            <button
              onClick={toggleBackgroundTracking}
              disabled={isLoadingTracking}
              className="w-full flex items-center justify-between gap-3 px-4 py-2 text-sm text-gray-800 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${backgroundTracking ? 'bg-[#1DB954] animate-pulse' : 'bg-gray-400'}`} />
                Background Tracking
              </span>
              <span
                className={`relative inline-flex h-5 w-10 flex-shrink-0 items-center rounded-full transition-colors duration-200 ${
                  backgroundTracking ? 'bg-[#1DB954]' : 'bg-gray-500'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    backgroundTracking ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </span>
            </button>

            <button
              onClick={() => {
                setShowImportModal(true);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-800 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
            >
              <CirclePlus className="w-4 h-4 text-[#1DB954]" />
              Import Data
            </button>
            <a
              href="#"
              onClick={spotifyLogOut}
              className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-neutral-700"
            >
              Log Out
            </a>
          </div>
        </div>
      )}

      {/* Import Data Modal */}
      <ImportDataModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        userId={userId}
      />
    </div>
  );
}
