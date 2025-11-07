"use client";

import { useEffect, useMemo, useState } from "react";
import ArtistModal from "./ArtistModal";

const TIME_RANGES = [
  { key: "short_term", label: "4 Weeks" },
  { key: "medium_term", label: "6 Months" },
  { key: "long_term", label: "12 Months" },
  { key: "all_time", label: "All Time" },
];

const SPOTIFY_TIME_RANGES = ["short_term", "medium_term", "long_term"];

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?auto=format&fit=crop&w=600&q=60",
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=600&q=60",
  "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=600&q=60",
  "https://images.unsplash.com/photo-1497032205916-ac775f0649ae?auto=format&fit=crop&w=600&q=60",
];

async function fetchSpotifyTopArtists(range, accessToken) {
  if (!accessToken) {
    return [];
  }

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/top/artists?time_range=${range}&limit=25`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const payload = await response.json();

    if (!response.ok) {
      console.warn(`[TopArtists] Spotify ${range} failed`, payload);
      return [];
    }

    return (payload.items || []).map((artist) => ({
      id: artist.id || `spotify-${range}-${artist.name}`,
      name: artist.name || "Unknown Artist",
      image: artist.images?.[0]?.url || "",
    }));
  } catch (error) {
    console.warn(`[TopArtists] Spotify ${range} error`, error);
    return [];
  }
}

async function fetchDbTopArtists(range, userId) {
  try {
    const response = await fetch(
      `/api/stats/top-artists?userId=${userId}&timeRange=${range}&limit=50`
    );
    const payload = await response.json();

    if (!response.ok) {
      console.warn(`[TopArtists] DB ${range} failed`, payload);
      return { counts: {}, list: [] };
    }

    const counts = {};
    const list = (payload.artists || []).map((artist, index) => {
      const id = artist.artistId || `db-${range}-${index}`;
      const name = artist.artistName || "Unknown Artist";
      const playCount = artist.playCount || 0;

      if (artist.artistId) {
        counts[artist.artistId] = playCount;
      }
      if (artist.artistName) {
        counts[artist.artistName.toLowerCase()] = playCount;
      }

      return { id, name, playCount, image: "" };
    });

    return { counts, list };
  } catch (error) {
    console.warn(`[TopArtists] DB ${range} error`, error);
    return { counts: {}, list: [] };
  }
}

const resolveCountFromMap = (map = {}, artist) => {
  if (!artist) return null;
  if (artist.id && map[artist.id] !== undefined) {
    return map[artist.id];
  }
  if (artist.name) {
    const key = artist.name.toLowerCase();
    if (map[key] !== undefined) {
      return map[key];
    }
  }
  return null;
};

async function fetchCountsForArtists(userId, timeRange, artists) {
  if (!artists.length) {
    return [];
  }

  try {
    const response = await fetch("/api/stats/artist-play-counts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        timeRange,
        artists: artists.map((artist) => ({
          id: artist.id || null,
          name: artist.name || null,
        })),
      }),
    });

    if (!response.ok) {
      const payload = await response.json();
      console.warn(`[TopArtists] artist-play-counts ${timeRange} failed`, payload);
      return [];
    }

    const payload = await response.json();
    return payload.counts || [];
  } catch (error) {
    console.warn(`[TopArtists] artist-play-counts ${timeRange} error`, error);
    return [];
  }
}

async function hydrateArtistImages(artists, accessToken) {
  if (!accessToken) {
    return artists;
  }

  const ids = artists
    .map((artist) => artist.id)
    .filter((id) => id && !id.startsWith("db-") && !id.startsWith("unknown"));

  if (!ids.length) {
    return artists;
  }

  const imageMap = {};

  for (let i = 0; i < ids.length; i += 20) {
    const chunk = ids.slice(i, i + 20);

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/artists?ids=${chunk.join(",")}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      data.artists?.forEach((artist) => {
        if (artist?.id) {
          imageMap[artist.id] = artist.images?.[0]?.url || "";
        }
      });
    } catch (error) {
      console.warn("Failed to hydrate artist images:", error);
    }
  }

  return artists.map((artist) => ({
    ...artist,
    image: artist.image || imageMap[artist.id] || "",
  }));
}

export default function UserTopArtists({ accessToken, userId }) {
  const [artistsCache, setArtistsCache] = useState({
    short_term: [],
    medium_term: [],
    long_term: [],
    all_time: [],
  });
  const [playCountsCache, setPlayCountsCache] = useState({
    short_term: {},
    medium_term: {},
    long_term: {},
    all_time: {},
  });
  const [timeRange, setTimeRange] = useState("short_term");
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      if (!userId || !accessToken) {
        setArtistsCache({
          short_term: [],
          medium_term: [],
          long_term: [],
          all_time: [],
        });
        setPlayCountsCache({
          short_term: {},
          medium_term: {},
          long_term: {},
          all_time: {},
        });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const spotifyResults = await Promise.all(
          SPOTIFY_TIME_RANGES.map((range) =>
            fetchSpotifyTopArtists(range, accessToken)
          )
        );

        const nextArtists = {
          short_term: spotifyResults[0] || [],
          medium_term: spotifyResults[1] || [],
          long_term: spotifyResults[2] || [],
          all_time: [],
        };

        const dbResults = await Promise.all(
          TIME_RANGES.map(({ key }) => fetchDbTopArtists(key, userId))
        );

        const countsByRange = {};
        const listByRange = {};
        TIME_RANGES.forEach(({ key }, index) => {
          const result = dbResults[index] || { counts: {}, list: [] };
          countsByRange[key] = { ...(result.counts || {}) };
          listByRange[key] = result.list || [];
        });

        let allTimeArtists = (listByRange.all_time || []).slice(0, 25);
        if (allTimeArtists.length) {
          allTimeArtists = await hydrateArtistImages(allTimeArtists, accessToken);
        }
        nextArtists.all_time = allTimeArtists;

        for (const range of SPOTIFY_TIME_RANGES) {
          const artists = nextArtists[range] || [];
          if (!artists.length) continue;

          const countsMap = countsByRange[range] || {};
          const missingArtists = artists.filter(
            (artist) => resolveCountFromMap(countsMap, artist) === null
          );

          if (!missingArtists.length) continue;

          const fetchedCounts = await fetchCountsForArtists(
            userId,
            range,
            missingArtists
          );

          if (fetchedCounts.length) {
            const updatedMap = { ...countsMap };
            fetchedCounts.forEach(({ id, name, playCount }) => {
              if (id) {
                updatedMap[id] = playCount;
              }
              if (name) {
                updatedMap[name.toLowerCase()] = playCount;
              }
            });
            countsByRange[range] = updatedMap;
          }
        }

        Object.entries(nextArtists).forEach(([range, artistList]) => {
          const map = countsByRange[range] || {};
          nextArtists[range] = artistList.map((artist) => ({
            ...artist,
            playCount: resolveCountFromMap(map, artist) ?? artist.playCount ?? null,
          }));
        });

        if (!cancelled) {
          setArtistsCache(nextArtists);
          setPlayCountsCache(countsByRange);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load top artists:", err);
          setError(err.message || "Failed to load top artists");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [userId, accessToken]);

  const currentArtists = useMemo(
    () => artistsCache[timeRange] || [],
    [artistsCache, timeRange]
  );

  const currentPlayCounts = playCountsCache[timeRange] || {};

  const getPlayCount = (artistId, artistName) =>
    resolveCountFromMap(currentPlayCounts, { id: artistId, name: artistName });

  const formatPlayCount = (count) => {
    if (count === null || count === undefined) {
      return "N/A";
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const renderArtistCard = (artist, index) => {
    const image = artist.image || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
    const displayPlays =
      artist.playCount ?? getPlayCount(artist.id, artist.name) ?? null;

    return (
      <div
        key={`${artist.id}-${index}`}
        className="flex-shrink-0 w-40 lg:w-44 bg-[rgba(255,255,255,0.05)] backdrop-blur-md border border-[rgba(255,255,255,0.1)] rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_8px_24px_rgba(29,185,84,0.3)] active:scale-95 lg:active:scale-100"
        onClick={() => setSelectedArtist(artist)}
      >
        {image ? (
          <img
            src={image}
            alt={artist.name}
            className="w-28 h-28 mx-auto rounded-full object-cover shadow-[0_8px_24px_rgba(29,185,84,0.3)] mb-4"
          />
        ) : (
          <div className="w-28 h-28 mx-auto rounded-full bg-[rgba(255,255,255,0.1)] flex items-center justify-center shadow-[0_8px_24px_rgba(29,185,84,0.3)] mb-4">
            <span className="text-white text-3xl font-bold">
              {artist.name?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
        )}

        <p className="text-[#1db954] text-[11px] font-bold uppercase tracking-wider mb-2 text-center">
          TOP #{index + 1}
        </p>
        <p className="text-white font-semibold text-[15px] text-center mb-2 truncate">
          {artist.name}
        </p>
        <div className="flex items-center justify-center gap-1 text-[12px] text-[#b3b3b3]">
          <span className="text-[#1db954]">&#9835;</span>
          <span>{formatPlayCount(displayPlays)} plays</span>
        </div>
      </div>
    );
  };

  const SkeletonCard = () => (
    <div className="flex-shrink-0 w-40 lg:w-44 bg-[rgba(255,255,255,0.05)] backdrop-blur-md border border-[rgba(255,255,255,0.1)] rounded-2xl p-5">
      <div className="w-28 h-28 mx-auto rounded-full bg-[rgba(255,255,255,0.1)] animate-pulse mb-4" />
      <div className="h-3 w-16 bg-[rgba(255,255,255,0.1)] rounded animate-pulse mb-2 mx-auto" />
      <div className="h-4 w-24 bg-[rgba(255,255,255,0.1)] rounded animate-pulse mb-2 mx-auto" />
      <div className="h-3 w-20 bg-[rgba(255,255,255,0.1)] rounded animate-pulse mx-auto" />
    </div>
  );

  return (
    <div className="w-full h-full min-h-0 flex flex-col ">
      <div className="z-10 px-4 lg:px-6 pt-6 mb-5">
        <p className="text-white text-2xl font-bold mb-4">Top Artists</p>
        <div className="flex justify-start gap-2 flex-wrap">
          {TIME_RANGES.map(({ key, label }) => (
            <button
              key={key}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeRange === key
                  ? "bg-[#1DB954] text-black"
                  : "bg-[rgba(255,255,255,0.05)] text-white hover:bg-[rgba(255,255,255,0.1)]"
              }`}
              onClick={() => setTimeRange(key)}
              disabled={isLoading}
            >
              {label}
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      </div>

      <div className=" pt-5 flex-1 min-h-0 overflow-x-auto horizontal-scrollbar px-4 lg:px-6 pb-6">
        {isLoading ? (
          <div className="flex gap-4 min-w-min pb-2">
            {[...Array(6)].map((_, index) => (
              <SkeletonCard key={`skeleton-${index}`} />
            ))}
          </div>
        ) : currentArtists.length > 0 ? (
          <div className="flex gap-4 min-w-min pb-2">
            {currentArtists.map((artist, index) => renderArtistCard(artist, index))}
          </div>
        ) : (
          <p className="text-white text-center py-8">
            No data available for this time range.
          </p>
        )}
      </div>

      {selectedArtist && (
        <ArtistModal
          artist={selectedArtist}
          userId={userId}
          onClose={() => setSelectedArtist(null)}
        />
      )}
    </div>
  );
}
