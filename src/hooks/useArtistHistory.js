"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook to fetch artist listening history data
 *
 * This hook properly handles:
 * - Race conditions (cancels old requests when params change)
 * - Concurrent requests (only one request at a time)
 * - Cleanup on unmount
 * - Proper React dependency tracking
 *
 * @param {string} artistId - Spotify artist ID
 * @param {string} userId - User's Spotify ID
 * @param {string} timeRange - Time range (7D, 30D, 3M, 6M, 1Y, ALL)
 * @param {string} artistName - Artist name for fallback matching (optional)
 * @param {boolean} enabled - Whether to fetch data (default: true)
 * @returns {object} { data, loading, error, refetch }
 */
export function useArtistHistory(artistId, userId, timeRange = '30D', artistName = null, enabled = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use ref to track the current request's abort controller
  const abortControllerRef = useRef(null);

  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);

  // Memoize the fetch function to prevent unnecessary recreations
  const fetchData = useCallback(async () => {
    if (!artistId || !userId || !enabled) {
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setLoading(true);
      setError(null);

<<<<<<< HEAD
      console.log(`🔄 Fetching artist history: ${artistId}, range: ${timeRange}`);

=======
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
      // Add artist name to URL for fallback matching
      const params = new URLSearchParams({
        userId,
        timeRange
      });
      if (artistName) {
        params.append('artistName', artistName);
      }

      const url = `/api/stats/artist-history/${artistId}?${params.toString()}`;
      const response = await fetch(url, {
        signal: abortController.signal,
      });

      // Check if request was aborted
      if (abortController.signal.aborted) {
<<<<<<< HEAD
        console.log('⏭️  Request aborted (new request started)');
=======
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
        return;
      }

      if (!response.ok) {
        // Handle 404 (no data) as empty data state, not an error
        if (response.status === 404) {
<<<<<<< HEAD
          console.log('ℹ️ No data available for this artist in the selected time range');

=======
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
          // Set empty data state instead of error
          if (isMountedRef.current && !abortController.signal.aborted) {
            setData({ chartData: [], totalPlays: 0, totalDays: 0 });
            setLoading(false);
          }
          return;
        }

        // For other errors, throw
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch artist history');
      }

      const result = await response.json();

      // Only update state if component is still mounted and request wasn't aborted
      if (isMountedRef.current && !abortController.signal.aborted) {
        setData(result);
<<<<<<< HEAD
        console.log(`✅ Fetched ${result.chartData.length} days of data for ${result.artistName}`);
=======
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
      }

    } catch (err) {
      // Ignore abort errors
      if (err.name === 'AbortError') {
<<<<<<< HEAD
        console.log('⏭️  Fetch aborted');
        return;
      }

      console.error('❌ Error fetching artist history:', err);

=======
        return;
      }

>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
      // Only update error state if component is still mounted
      if (isMountedRef.current) {
        setError(err.message);
      }
    } finally {
      // Only update loading state if component is still mounted and request wasn't aborted
      if (isMountedRef.current && !abortController.signal.aborted) {
        setLoading(false);
      }
    }
<<<<<<< HEAD
  }, [artistId, userId, timeRange, enabled]);
=======
  }, [artistId, userId, timeRange, artistName, enabled]);
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600

  // Fetch data when dependencies change
  useEffect(() => {
    if (enabled) {
      fetchData();
    }

    // Cleanup function
    return () => {
      // Abort any in-flight requests when component unmounts or dependencies change
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, fetchData]);

  // Track mount state
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
