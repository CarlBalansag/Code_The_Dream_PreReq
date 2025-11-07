"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for Spotify search with debouncing and request cancellation
 *
 * @param {string} accessToken - Spotify access token
 * @param {number} debounceDelay - Delay in ms before search (default: 300)
 * @returns {object} { results, loading, error, search, clearResults }
 */
export function useSpotifySearch(accessToken, debounceDelay = 300) {
  const [results, setResults] = useState({ artists: [], tracks: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const debounceTimerRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Search function
  const search = useCallback((query) => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Clear previous results and errors
    setError(null);

    // If query is empty or too short, clear results
    if (!query || query.length < 1) {
      setResults({ artists: [], tracks: [], total: 0 });
      setLoading(false);
      return;
    }

    // Set loading state immediately
    setLoading(true);

    // Debounce the API call
    debounceTimerRef.current = setTimeout(async () => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        console.log(`🔍 Searching for: "${query}"`);

        const response = await fetch(
          `/api/search/spotify?query=${encodeURIComponent(query)}&limit=5&accessToken=${encodeURIComponent(accessToken)}`,
          { signal: abortController.signal }
        );

        // Check if request was aborted
        if (abortController.signal.aborted) {
          console.log('⏭️  Search request aborted');
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Search failed');
        }

        const data = await response.json();

        console.log(`✅ Search results:`, data);
        setResults(data);
        setLoading(false);
      } catch (err) {
        // Ignore abort errors
        if (err.name === 'AbortError') {
          console.log('⏭️  Search aborted');
          return;
        }

        console.error('❌ Search error:', err);
        setError(err.message);
        setLoading(false);
        setResults({ artists: [], tracks: [], total: 0 });
      }
    }, debounceDelay);
  }, [accessToken, debounceDelay]);

  // Clear results function
  const clearResults = useCallback(() => {
    setResults({ artists: [], tracks: [], total: 0 });
    setLoading(false);
    setError(null);

    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clearResults,
  };
}
