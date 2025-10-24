import { Play } from "../models/Play.js";
import { connectToDB } from "../mongodb.js";

/**
 * Play Database Operations
 * All functions for managing plays (listening history) in the database
 */

/**
 * Track a new play
 * Called when detecting a new song from Spotify's "recently played" endpoint
 */
export async function trackPlay(playData) {
  await connectToDB();

  const {
    userId,
    trackId,
    trackName,
    artistId,
    artistName,
    albumId,
    albumName,
    albumImage,
    playedAt,
    durationMs,
    source = "tracked",
  } = playData;

  try {
    // Check if this play already exists (prevent duplicates)
    const exists = await Play.playExists(userId, trackId, new Date(playedAt));

    if (exists) {
      console.log(`⚠️  Play already exists: ${trackName} at ${playedAt}`);
      return null;
    }

    // Create new play
    const play = await Play.create({
      userId,
      trackId,
      trackName,
      artistId,
      artistName,
      albumId,
      albumName,
      albumImage,
      playedAt: new Date(playedAt),
      durationMs,
      source,
    });

    console.log(`✅ Tracked play: ${trackName} by ${artistName}`);
    return play;
  } catch (error) {
    // Handle duplicate key error gracefully
    if (error.code === 11000) {
      console.log(`⚠️  Duplicate play detected: ${trackName}`);
      return null;
    }
    console.error("❌ Error tracking play:", error.message);
    throw error;
  }
}

/**
 * Track multiple plays at once
 * Called when importing initial 50 tracks or full history
 */
export async function trackMultiplePlays(playsArray) {
  await connectToDB();

  try {
    // Format plays for bulk insert
    const formattedPlays = playsArray.map((play) => ({
      userId: play.userId,
      trackId: play.trackId,
      trackName: play.trackName,
      artistId: play.artistId,
      artistName: play.artistName,
      albumId: play.albumId,
      albumName: play.albumName,
      albumImage: play.albumImage,
      playedAt: new Date(play.playedAt),
      durationMs: play.durationMs,
      source: play.source || "tracked",
    }));

    // Bulk insert with duplicate handling
    const result = await Play.bulkInsertPlays(formattedPlays);

    console.log(`✅ Bulk insert: ${result.inserted} plays inserted`);
    if (result.duplicates) {
      console.log(`⚠️  Skipped ${result.duplicates} duplicates`);
    }

    return result;
  } catch (error) {
    console.error("❌ Error tracking multiple plays:", error.message);
    throw error;
  }
}

/**
 * Get recent plays for a user
 */
export async function getRecentPlays(userId, limit = 50) {
  await connectToDB();

  try {
    const plays = await Play.getRecentPlays(userId, limit);
    return plays;
  } catch (error) {
    console.error("❌ Error getting recent plays:", error.message);
    throw error;
  }
}

/**
 * Get plays for a specific date range
 */
export async function getPlaysByDateRange(userId, startDate, endDate) {
  await connectToDB();

  try {
    const plays = await Play.find({
      userId,
      playedAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    })
      .sort({ playedAt: -1 })
      .select("-__v");

    return plays;
  } catch (error) {
    console.error("❌ Error getting plays by date range:", error.message);
    throw error;
  }
}

/**
 * Get total play count for a user
 */
export async function getTotalPlays(userId) {
  await connectToDB();

  try {
    const count = await Play.getTotalPlays(userId);
    return count;
  } catch (error) {
    console.error("❌ Error getting total plays:", error.message);
    throw error;
  }
}

/**
 * Get total listening time for a user (in milliseconds)
 */
export async function getTotalListeningTime(userId) {
  await connectToDB();

  try {
    const totalMs = await Play.getTotalListeningTime(userId);
    return totalMs;
  } catch (error) {
    console.error("❌ Error getting total listening time:", error.message);
    throw error;
  }
}

/**
 * Get the last tracked play timestamp for a user
 * Used to know where to start checking for new plays
 */
export async function getLastPlayTimestamp(userId) {
  await connectToDB();

  try {
    const lastPlay = await Play.findOne({ userId })
      .sort({ playedAt: -1 })
      .select("playedAt");

    return lastPlay ? lastPlay.playedAt : null;
  } catch (error) {
    console.error("❌ Error getting last play timestamp:", error.message);
    throw error;
  }
}

/**
 * Delete all plays for a user
 * WARNING: This is permanent!
 */
export async function deleteUserPlays(userId) {
  await connectToDB();

  try {
    const result = await Play.deleteMany({ userId });
    console.log(`✅ Deleted ${result.deletedCount} plays for user ${userId}`);
    return result;
  } catch (error) {
    console.error("❌ Error deleting user plays:", error.message);
    throw error;
  }
}

/**
 * Get play statistics for a user
 */
export async function getPlayStats(userId) {
  await connectToDB();

  try {
    const totalPlays = await Play.getTotalPlays(userId);
    const totalMs = await Play.getTotalListeningTime(userId);
    const lastPlay = await Play.findOne({ userId })
      .sort({ playedAt: -1 })
      .select("playedAt");
    const firstPlay = await Play.findOne({ userId })
      .sort({ playedAt: 1 })
      .select("playedAt");

    // Count unique tracks, artists, albums
    const uniqueTracks = await Play.distinct("trackId", { userId });
    const uniqueArtists = await Play.distinct("artistId", { userId });
    const uniqueAlbums = await Play.distinct("albumId", { userId });

    return {
      totalPlays,
      totalListeningTimeMs: totalMs,
      totalListeningTimeHours: Math.round(totalMs / 1000 / 60 / 60),
      uniqueTracks: uniqueTracks.length,
      uniqueArtists: uniqueArtists.length,
      uniqueAlbums: uniqueAlbums.length,
      firstPlayDate: firstPlay ? firstPlay.playedAt : null,
      lastPlayDate: lastPlay ? lastPlay.playedAt : null,
    };
  } catch (error) {
    console.error("❌ Error getting play stats:", error.message);
    throw error;
  }
}

/**
 * Get plays for a specific track
 */
export async function getTrackPlays(userId, trackId) {
  await connectToDB();

  try {
    const plays = await Play.find({ userId, trackId })
      .sort({ playedAt: -1 })
      .select("-__v");

    return plays;
  } catch (error) {
    console.error("❌ Error getting track plays:", error.message);
    throw error;
  }
}

/**
 * Get plays for a specific artist
 */
export async function getArtistPlays(userId, artistId) {
  await connectToDB();

  try {
    const plays = await Play.find({ userId, artistId })
      .sort({ playedAt: -1 })
      .select("-__v");

    return plays;
  } catch (error) {
    console.error("❌ Error getting artist plays:", error.message);
    throw error;
  }
}

/**
 * Get plays for a specific album
 */
export async function getAlbumPlays(userId, albumId) {
  await connectToDB();

  try {
    const plays = await Play.find({ userId, albumId })
      .sort({ playedAt: -1 })
      .select("-__v");

    return plays;
  } catch (error) {
    console.error("❌ Error getting album plays:", error.message);
    throw error;
  }
}
