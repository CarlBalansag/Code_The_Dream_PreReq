import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import prisma from "../prisma.js";

const PLAY_SOURCES = {
  tracked: 0,
  initial_import: 1,
  full_import: 2,
};

const SOURCE_LABELS = Object.entries(PLAY_SOURCES).reduce((acc, [label, code]) => {
  acc[code] = label;
  return acc;
}, {});

const BULK_CHUNK_SIZE = 1000;

function normalizeString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function buildSyntheticId(prefix, parts) {
  const base = parts.filter(Boolean).join("-") || "unknown";
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "item";
  const hash = crypto.createHash("sha1").update(base).digest("hex").slice(0, 8);
  return `${prefix}_${slug}_${hash}`.slice(0, 95);
}

function withDeterministicIds(play) {
  const trackName = normalizeString(play.trackName);
  const artistName = normalizeString(play.artistName);
  const albumName = normalizeString(play.albumName);

  let trackId = normalizeString(play.trackId);
  let artistId = normalizeString(play.artistId);
  let albumId = normalizeString(play.albumId);

  if (!artistId && artistName) {
    artistId = buildSyntheticId("artist", [artistName]);
  }

  if (!albumId && albumName) {
    albumId = buildSyntheticId("album", [artistName, albumName]);
  }

  if (!trackId && trackName) {
    trackId = buildSyntheticId("track", [artistName, trackName]);
  }

  return {
    ...play,
    trackId,
    artistId,
    albumId,
    trackName,
    artistName,
    albumName,
  };
}

function toSourceCode(source = "tracked") {
  return PLAY_SOURCES[source] ?? PLAY_SOURCES.tracked;
}

function fromSourceCode(code) {
  return SOURCE_LABELS[code] || "tracked";
}

function chunkArray(items, size = BULK_CHUNK_SIZE) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function createManyChunked(delegate, data, size = BULK_CHUNK_SIZE) {
  for (const chunk of chunkArray(data, size)) {
    if (!chunk.length) continue;
    await delegate.createMany({
      data: chunk,
      skipDuplicates: true,
    });
  }
}

function normalizePlayBatch(plays) {
  const artists = new Map();
  const albums = new Map();
  const tracks = new Map();
  const normalizedPlays = [];

  for (const entry of plays) {
    if (!entry?.userId || !entry.playedAt) {
      continue;
    }

    const playedAt = new Date(entry.playedAt);
    if (Number.isNaN(playedAt.getTime())) {
      continue;
    }

    const normalized = withDeterministicIds(entry);

    if (normalized.artistId && normalized.artistName && !artists.has(normalized.artistId)) {
      artists.set(normalized.artistId, {
        id: normalized.artistId,
        name: normalized.artistName,
      });
    }

    if (
      normalized.albumId &&
      normalized.albumName &&
      !albums.has(normalized.albumId)
    ) {
      albums.set(normalized.albumId, {
        id: normalized.albumId,
        name: normalized.albumName,
        artist_id: normalized.artistId,
        image_url: normalizeString(normalized.albumImage),
      });
    }

    if (normalized.trackId && normalized.trackName && !tracks.has(normalized.trackId)) {
      tracks.set(normalized.trackId, {
        id: normalized.trackId,
        name: normalized.trackName,
        artist_id: normalized.artistId,
        album_id: normalized.albumId,
        duration_ms: Number.isFinite(normalized.durationMs)
          ? Math.max(0, Math.round(normalized.durationMs))
          : 0,
      });
    }

    normalizedPlays.push({
      user_id: normalized.userId,
      track_id: normalized.trackId,
      played_at: playedAt,
      source: toSourceCode(normalized.source),
    });
  }

  return {
    artists: Array.from(artists.values()),
    albums: Array.from(albums.values()),
    tracks: Array.from(tracks.values()),
    plays: normalizedPlays,
  };
}

function mapPlayRecord(record) {
  const track = record.tracks;
  const artist = track?.artists;
  const album = track?.albums;

  return {
    id: record.id ? record.id.toString() : undefined,
    userId: record.user_id,
    trackId: record.track_id,
    trackName: track?.name || null,
    artistId: track?.artist_id || null,
    artistName: artist?.name || null,
    albumId: track?.album_id || null,
    albumName: album?.name || null,
    albumImage: album?.image_url || null,
    playedAt: record.played_at,
    durationMs: track?.duration_ms ?? null,
    source: fromSourceCode(record.source),
  };
}

export async function trackPlay(playData) {
  const result = await trackMultiplePlays([playData]);
  return result.inserted > 0;
}

export async function trackMultiplePlays(playsArray) {
  if (!Array.isArray(playsArray) || playsArray.length === 0) {
    return { inserted: 0, duplicates: 0 };
  }

  const normalized = normalizePlayBatch(playsArray);
  if (!normalized.plays.length) {
    return { inserted: 0, duplicates: 0 };
  }

  let inserted = 0;
  let duplicates = 0;

  await prisma.$transaction(async (tx) => {
    if (normalized.artists.length) {
      await createManyChunked(tx.artists, normalized.artists);
    }
    if (normalized.albums.length) {
      await createManyChunked(tx.albums, normalized.albums);
    }
    if (normalized.tracks.length) {
      await createManyChunked(tx.tracks, normalized.tracks);
    }

    for (const chunk of chunkArray(normalized.plays)) {
      const result = await tx.plays.createMany({
        data: chunk,
        skipDuplicates: true,
      });
      inserted += result.count;
      duplicates += chunk.length - result.count;
    }
  });

  return {
    inserted,
    duplicates: Math.max(duplicates, 0),
  };
}

export async function getRecentPlays(userId, limit = 50) {
  const plays = await prisma.plays.findMany({
    where: { user_id: userId },
    include: {
      tracks: {
        include: {
          artists: true,
          albums: true,
        },
      },
    },
    orderBy: { played_at: "desc" },
    take: limit,
  });

  return plays.map(mapPlayRecord);
}

export async function countUserPlays(userId) {
  return prisma.plays.count({
    where: { user_id: userId },
  });
}

export async function countUserPlaysInRange(userId, startDate, endDate) {
  return prisma.plays.count({
    where: {
      user_id: userId,
      played_at: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
}

function buildDateFilters(userId, startDate, endDate) {
  const filters = [Prisma.sql`p.user_id = ${userId}`];
  if (startDate) {
    filters.push(Prisma.sql`p.played_at >= ${startDate}`);
  }
  if (endDate) {
    filters.push(Prisma.sql`p.played_at <= ${endDate}`);
  }
  return Prisma.join(filters, ' AND ');
}

export async function getTopArtists(userId, { startDate = null, endDate = null, limit = 50 } = {}) {
  const whereClause = buildDateFilters(userId, startDate, endDate);

  const rows = await prisma.$queryRaw`
    SELECT
      COALESCE(t.artist_id, 'unknown') AS artist_id,
      COALESCE(ar.name, 'Unknown Artist') AS artist_name,
      COUNT(*)::bigint AS play_count,
      COALESCE(SUM(t.duration_ms), 0)::bigint AS total_duration_ms,
      MIN(p.played_at) AS first_played,
      MAX(p.played_at) AS last_played
    FROM plays p
    LEFT JOIN tracks t ON t.id = p.track_id
    LEFT JOIN artists ar ON ar.id = t.artist_id
    WHERE ${whereClause}
    GROUP BY artist_id, artist_name
    ORDER BY play_count DESC
    LIMIT ${limit};
  `;

  return rows.map((row) => ({
    artistId: row.artist_id,
    artistName: row.artist_name,
    playCount: Number(row.play_count),
    totalDurationMs: Number(row.total_duration_ms),
    firstPlayed: row.first_played,
    lastPlayed: row.last_played,
  }));
}

export async function getArtistDailyHistory({
  userId,
  artistId,
  artistName,
  startDate,
  endDate,
  timezone,
}) {
  const rows = await prisma.$queryRaw`
    WITH total_by_day AS (
      SELECT
        (p.played_at AT TIME ZONE ${timezone})::date AS date_key,
        COUNT(*)::int AS total_songs
      FROM plays p
      WHERE p.user_id = ${userId}
        AND p.played_at BETWEEN ${startDate} AND ${endDate}
      GROUP BY date_key
    ),
    artist_by_day AS (
      SELECT
        (p.played_at AT TIME ZONE ${timezone})::date AS date_key,
        COUNT(*)::int AS artist_songs
      FROM plays p
      LEFT JOIN tracks t ON t.id = p.track_id
      LEFT JOIN artists ar ON ar.id = t.artist_id
      WHERE p.user_id = ${userId}
        AND p.played_at BETWEEN ${startDate} AND ${endDate}
        AND (
          ${
            artistId
              ? Prisma.sql`t.artist_id = ${artistId}`
              : Prisma.sql`FALSE`
          } OR ${
            artistName
              ? Prisma.sql`(ar.name IS NOT NULL AND LOWER(ar.name) = LOWER(${artistName}))`
              : Prisma.sql`FALSE`
          }
        )
      GROUP BY date_key
    )
    SELECT
      t.date_key::text AS date,
      t.total_songs,
      COALESCE(a.artist_songs, 0)::int AS artist_songs
    FROM total_by_day t
    LEFT JOIN artist_by_day a ON a.date_key = t.date_key
    ORDER BY t.date_key;
  `;

  return rows.map((row) => ({
    date: row.date,
    totalSongs: Number(row.total_songs),
    artistSongs: Number(row.artist_songs),
  }));
}

export async function getArtistFirstPlayDate(userId, artistId, artistName) {
  const rows = await prisma.$queryRaw`
    SELECT MIN(p.played_at) AS first_play
    FROM plays p
    LEFT JOIN tracks t ON t.id = p.track_id
    LEFT JOIN artists ar ON ar.id = t.artist_id
    WHERE p.user_id = ${userId}
      AND (
        ${
          artistId
            ? Prisma.sql`t.artist_id = ${artistId}`
            : Prisma.sql`FALSE`
        } OR ${
          artistName
            ? Prisma.sql`(ar.name IS NOT NULL AND LOWER(ar.name) = LOWER(${artistName}))`
            : Prisma.sql`FALSE`
        }
      );
  `;

  return rows[0]?.first_play || null;
}

export async function getArtistPlayCount(
  userId,
  { artistId = null, artistName = null, startDate = null, endDate = null } = {}
) {
  if (!userId || (!artistId && !artistName)) {
    return 0;
  }

  const rows = await prisma.$queryRaw`
    SELECT COUNT(*)::bigint AS play_count
    FROM plays p
    LEFT JOIN tracks t ON t.id = p.track_id
    LEFT JOIN artists ar ON ar.id = t.artist_id
    WHERE
      p.user_id = ${userId}
      ${startDate ? Prisma.sql`AND p.played_at >= ${startDate}` : Prisma.empty}
      ${endDate ? Prisma.sql`AND p.played_at <= ${endDate}` : Prisma.empty}
      AND (
        ${
          artistId
            ? Prisma.sql`t.artist_id = ${artistId}`
            : Prisma.sql`FALSE`
        } OR ${
          artistName
            ? Prisma.sql`LOWER(COALESCE(ar.name, '')) = LOWER(${artistName})`
            : Prisma.sql`FALSE`
        }
      );
  `;

  return rows[0]?.play_count ? Number(rows[0].play_count) : 0;
}

/**
 * Check if a user has any listening history for a specific artist
 * @param {string} userId - User's Spotify ID
 * @param {string} artistId - Artist's Spotify ID
 * @returns {Promise<boolean>} - True if user has listened to this artist
 */
export async function hasArtistHistory(userId, artistId) {
  if (!userId || !artistId) {
    return false;
  }

  const count = await prisma.plays.count({
    where: {
      user_id: userId,
      tracks: {
        artist_id: artistId,
      },
    },
    take: 1, // Only need to know if at least 1 exists
  });

  return count > 0;
}
