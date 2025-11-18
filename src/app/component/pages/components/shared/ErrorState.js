"use client";

import { AlertCircle } from "lucide-react";

/**
 * Consistent Error State Component
 * Displays error messages with optional retry functionality
 *
 * @param {string} error - Error message to display
 * @param {function} onRetry - Optional retry function
 * @param {string} title - Optional custom title (defaults to "Something went wrong")
 */
export default function ErrorState({ error, onRetry, title = "Something went wrong" }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Error Icon */}
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <AlertCircle className="text-red-400" size={32} />
      </div>

      {/* Error Title */}
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>

      {/* Error Message */}
      <p className="text-gray-400 text-sm max-w-sm mb-4">
        {error || "An unexpected error occurred. Please try again."}
      </p>

      {/* Retry Button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-[rgba(255,255,255,0.1)] text-white rounded-lg hover:bg-[rgba(255,255,255,0.15)] transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
