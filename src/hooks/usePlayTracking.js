"use client";

import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook to track user's plays by polling Spotify API
 * @param {object} user - User object with spotifyId
 * @param {number} intervalMs - Polling interval in milliseconds (default 3 minutes)
 * @param {boolean} enabled - Whether polling is enabled (default true)
 */
export function usePlayTracking(user, intervalMs = 3 * 60 * 1000, enabled = true) {
  const [lastPollResult, setLastPollResult] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  // Function to poll for new plays
  const pollForNewPlays = async () => {
    if (!user?.spotifyId || isPolling) {
      return;
    }

    try {
      setIsPolling(true);
      setError(null);

      console.log('🔄 Polling for new plays...');

      const response = await fetch('/api/poll/plays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spotifyId: user.spotifyId,
        }),
      });

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ API returned non-JSON response (likely an error page)');
        const text = await response.text();
        console.error('Response preview:', text.substring(0, 200));
        throw new Error('API returned invalid response format. Check server logs.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to poll for plays');
      }

      setLastPollResult(data);

      if (data.newPlays > 0) {
        console.log(`✅ Found ${data.newPlays} new plays`);
      }

    } catch (err) {
      console.error('❌ Polling error:', err.message);
      setError(err.message);
    } finally {
      setIsPolling(false);
    }
  };

  // Set up polling interval
  useEffect(() => {
    if (!enabled || !user?.spotifyId) {
      return;
    }

    // Poll immediately on mount
    pollForNewPlays();

    // Set up interval for continuous polling
    intervalRef.current = setInterval(() => {
      pollForNewPlays();
    }, intervalMs);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user?.spotifyId, intervalMs, enabled]);

  return {
    pollForNewPlays,
    lastPollResult,
    isPolling,
    error,
  };
}

/**
 * Hook for manual polling (no automatic interval)
 */
export function useManualPlayTracking(user) {
  const [lastPollResult, setLastPollResult] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState(null);

  const pollForNewPlays = async () => {
    if (!user?.spotifyId || isPolling) {
      return;
    }

    try {
      setIsPolling(true);
      setError(null);

      const response = await fetch('/api/poll/plays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spotifyId: user.spotifyId,
        }),
      });

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ API returned non-JSON response (likely an error page)');
        const text = await response.text();
        console.error('Response preview:', text.substring(0, 200));
        throw new Error('API returned invalid response format. Check server logs.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to poll for plays');
      }

      setLastPollResult(data);
      return data;

    } catch (err) {
      console.error('❌ Polling error:', err.message);
      setError(err.message);
      throw err;
    } finally {
      setIsPolling(false);
    }
  };

  return {
    pollForNewPlays,
    lastPollResult,
    isPolling,
    error,
  };
}
