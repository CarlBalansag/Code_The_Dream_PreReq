"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function FloatingActionButton({ onClick, showInfoPage, tourActive, disabled = false }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = () => {
    if (tourActive || disabled) return;
    onClick();
  };

  const buttonContent = (
    <button
      onClick={handleClick}
      className={`p-2 rounded-full transition-all duration-300 ${
        tourActive || disabled
          ? 'cursor-default opacity-50'
          : 'cursor-pointer hover:bg-gray-800/50'
      }`}
      title={disabled ? 'Play a song to view now playing' : showInfoPage ? 'View now playing' : 'View stats'}
      disabled={disabled && !tourActive}
    >
      {showInfoPage ? (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 5v14l11-7L8 5z"
            fill="#1DB954"
          />
        </svg>
      ) : (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="6" y="4" width="4" height="16" fill="#1DB954" />
          <rect x="14" y="4" width="4" height="16" fill="#1DB954" />
        </svg>
      )}
    </button>
  );

  if (!mounted) return null;

  const navbarSlot = document.getElementById('fab-navbar-slot');

  if (navbarSlot) {
    return createPortal(buttonContent, navbarSlot);
  }

  return null;
}
