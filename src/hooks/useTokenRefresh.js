import { useCallback, useRef } from 'react';

/**
 * Hook to handle Spotify API calls with automatic token refresh on 401
 *
 * @param {string} accessToken - Current access token
 * @param {string} userId - User's Spotify ID
 * @param {function} onTokenRefresh - Callback when token is refreshed (receives new token)
 * @returns {function} fetchWithTokenRefresh - Function to make API calls with auto-refresh
 */
export function useTokenRefresh(accessToken, userId, onTokenRefresh) {
  const isRefreshingRef = useRef(false);
  const refreshPromiseRef = useRef(null);

  const refreshToken = useCallback(async () => {
    // If already refreshing, return the existing promise
    if (isRefreshingRef.current && refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    isRefreshingRef.current = true;

    refreshPromiseRef.current = (async () => {
      try {
        console.log('🔄 Refreshing access token...');

        const response = await fetch('/api/refresh-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Token refresh failed');
        }

        const data = await response.json();
        console.log('✅ Token refreshed successfully');

        // Notify parent component of new token
        if (onTokenRefresh) {
          onTokenRefresh(data.access_token);
        }

        return data.access_token;
      } catch (error) {
        console.error('❌ Token refresh error:', error);
        throw error;
      } finally {
        isRefreshingRef.current = false;
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, [userId, onTokenRefresh]);

  /**
   * Make a Spotify API call with automatic token refresh on 401
   *
   * @param {string} url - Spotify API URL
   * @param {object} options - Fetch options
   * @returns {Promise<Response>} - Fetch response
   */
  const fetchWithTokenRefresh = useCallback(
    async (url, options = {}) => {
      // First attempt with current token
      let response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // If 401, try to refresh token and retry
      if (response.status === 401) {
        console.log('🔑 Got 401, attempting token refresh...');

        try {
          const newToken = await refreshToken();

          // Retry the original request with new token
          response = await fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${newToken}`,
            },
          });
        } catch (error) {
          console.error('❌ Failed to refresh token:', error);
          // Return the original 401 response
          return response;
        }
      }

      return response;
    },
    [accessToken, refreshToken]
  );

  return { fetchWithTokenRefresh, refreshToken };
}
