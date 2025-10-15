import { Play } from "../models/Play.js";
import { connectToDB } from "../mongodb.js";

/**
 * Statistics Query Functions
 * Optimized queries for generating user listening statistics
 */

/**
 * Get user's top tracks
 * @param {string} userId - User's Spotify ID
 * @param {object} options - Query options
 * @param {Date} options.startDate - Filter plays after this date
 * @param {Date} options.endDate - Filter plays before this date
 * @param {number} options.limit - Number of results (default 50)
 * @returns {Array} Top tracks with play counts and metadata
 */
export async function getTopTracks(userId, options = {}) {
  await connectToDB();

  try {
    const tracks = await Play.getTopTracks(userId, options);
    return tracks;
  } catch (error) {
    console.error("❌ Error getting top tracks:", error.message);
    throw error;
  }
}

/**
 * Get user's top artists
 * @param {string} userId - User's Spotify ID
 * @param {object} options - Query options
 * @param {Date} options.startDate - Filter plays after this date
 * @param {Date} options.endDate - Filter plays before this date
 * @param {number} options.limit - Number of results (default 50)
 * @returns {Array} Top artists with play counts and metadata
 */
export async function getTopArtists(userId, options = {}) {
  await connectToDB();

  try {
    const artists = await Play.getTopArtists(userId, options);
    return artists;
  } catch (error) {
    console.error("❌ Error getting top artists:", error.message);
    throw error;
  }
}

/**
 * Get user's top albums
 * @param {string} userId - User's Spotify ID
 * @param {object} options - Query options
 * @param {Date} options.startDate - Filter plays after this date
 * @param {Date} options.endDate - Filter plays before this date
 * @param {number} options.limit - Number of results (default 50)
 * @returns {Array} Top albums with play counts and metadata
 */
export async function getTopAlbums(userId, options = {}) {
  await connectToDB();

  try {
    const albums = await Play.getTopAlbums(userId, options);
    return albums;
  } catch (error) {
    console.error("❌ Error getting top albums:", error.message);
    throw error;
  }
}

/**
 * Get listening history timeline (plays grouped by month)
 * @param {string} userId - User's Spotify ID
 * @returns {Array} Monthly play counts and listening time
 */
export async function getListeningTimeline(userId) {
  await connectToDB();

  try {
    const timeline = await Play.getListeningTimeline(userId);
    return timeline;
  } catch (error) {
    console.error("❌ Error getting listening timeline:", error.message);
    throw error;
  }
}

/**
 * Get comprehensive listening stats for a time period
 * Includes top tracks, artists, albums, and totals
 */
export async function getComprehensiveStats(userId, options = {}) {
  await connectToDB();

  const { startDate, endDate, topLimit = 10 } = options;

  try {
    // Build match query
    const matchQuery = { userId };
    if (startDate || endDate) {
      matchQuery.playedAt = {};
      if (startDate) matchQuery.playedAt.$gte = new Date(startDate);
      if (endDate) matchQuery.playedAt.$lte = new Date(endDate);
    }

    // Run all queries in parallel for performance
    const [
      topTracks,
      topArtists,
      topAlbums,
      totalPlays,
      totalListeningTime,
      uniqueStats,
    ] = await Promise.all([
      Play.getTopTracks(userId, { startDate, endDate, limit: topLimit }),
      Play.getTopArtists(userId, { startDate, endDate, limit: topLimit }),
      Play.getTopAlbums(userId, { startDate, endDate, limit: topLimit }),
      Play.countDocuments(matchQuery),
      Play.aggregate([
        { $match: matchQuery },
        { $group: { _id: null, total: { $sum: "$durationMs" } } },
      ]),
      Play.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            uniqueTracks: { $addToSet: "$trackId" },
            uniqueArtists: { $addToSet: "$artistId" },
            uniqueAlbums: { $addToSet: "$albumId" },
          },
        },
        {
          $project: {
            uniqueTracks: { $size: "$uniqueTracks" },
            uniqueArtists: { $size: "$uniqueArtists" },
            uniqueAlbums: { $size: "$uniqueAlbums" },
          },
        },
      ]),
    ]);

    const totalMs =
      totalListeningTime.length > 0 ? totalListeningTime[0].total : 0;
    const unique = uniqueStats.length > 0 ? uniqueStats[0] : {};

    return {
      period: {
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      totals: {
        plays: totalPlays,
        listeningTimeMs: totalMs,
        listeningTimeHours: Math.round(totalMs / 1000 / 60 / 60),
        listeningTimeDays: Math.round(totalMs / 1000 / 60 / 60 / 24),
        uniqueTracks: unique.uniqueTracks || 0,
        uniqueArtists: unique.uniqueArtists || 0,
        uniqueAlbums: unique.uniqueAlbums || 0,
      },
      topTracks,
      topArtists,
      topAlbums,
    };
  } catch (error) {
    console.error("❌ Error getting comprehensive stats:", error.message);
    throw error;
  }
}

/**
 * Get stats for a specific time period (last week, month, year, all time)
 */
export async function getStatsByPeriod(userId, period = "all") {
  await connectToDB();

  let startDate = null;
  const endDate = new Date();

  switch (period) {
    case "week":
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "3months":
      startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "6months":
      startDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      break;
    case "year":
      startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      break;
    case "all":
    default:
      startDate = null;
      break;
  }

  return getComprehensiveStats(userId, { startDate, endDate });
}

/**
 * Get listening stats by day of week
 * Shows which days user listens most
 */
export async function getListeningByDayOfWeek(userId) {
  await connectToDB();

  try {
    const result = await Play.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: { $dayOfWeek: "$playedAt" }, // 1 = Sunday, 7 = Saturday
          playCount: { $sum: 1 },
          totalDurationMs: { $sum: "$durationMs" },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          dayOfWeek: "$_id",
          dayName: {
            $switch: {
              branches: [
                { case: { $eq: ["$_id", 1] }, then: "Sunday" },
                { case: { $eq: ["$_id", 2] }, then: "Monday" },
                { case: { $eq: ["$_id", 3] }, then: "Tuesday" },
                { case: { $eq: ["$_id", 4] }, then: "Wednesday" },
                { case: { $eq: ["$_id", 5] }, then: "Thursday" },
                { case: { $eq: ["$_id", 6] }, then: "Friday" },
                { case: { $eq: ["$_id", 7] }, then: "Saturday" },
              ],
            },
          },
          playCount: 1,
          totalDurationMs: 1,
          avgDurationMs: { $divide: ["$totalDurationMs", "$playCount"] },
        },
      },
    ]);

    return result;
  } catch (error) {
    console.error("❌ Error getting listening by day:", error.message);
    throw error;
  }
}

/**
 * Get listening stats by hour of day
 * Shows what times user listens most
 */
export async function getListeningByHourOfDay(userId) {
  await connectToDB();

  try {
    const result = await Play.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: { $hour: "$playedAt" },
          playCount: { $sum: 1 },
          totalDurationMs: { $sum: "$durationMs" },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          hour: "$_id",
          playCount: 1,
          totalDurationMs: 1,
        },
      },
    ]);

    return result;
  } catch (error) {
    console.error("❌ Error getting listening by hour:", error.message);
    throw error;
  }
}

/**
 * Get first listen dates for artists/tracks
 * Useful for "You've been listening to X for Y years"
 */
export async function getFirstListenDate(userId, { trackId, artistId }) {
  await connectToDB();

  try {
    const query = { userId };
    if (trackId) query.trackId = trackId;
    if (artistId) query.artistId = artistId;

    const firstPlay = await Play.findOne(query)
      .sort({ playedAt: 1 })
      .select("playedAt trackName artistName");

    return firstPlay;
  } catch (error) {
    console.error("❌ Error getting first listen date:", error.message);
    throw error;
  }
}

/**
 * Get listening streaks
 * Find longest consecutive days of listening
 */
export async function getListeningStreaks(userId) {
  await connectToDB();

  try {
    // Get all unique dates with plays
    const datesWithPlays = await Play.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: {
            year: { $year: "$playedAt" },
            month: { $month: "$playedAt" },
            day: { $dayOfMonth: "$playedAt" },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let lastDate = null;

    for (const dateObj of datesWithPlays) {
      const date = new Date(
        dateObj._id.year,
        dateObj._id.month - 1,
        dateObj._id.day
      );

      if (lastDate) {
        const dayDiff = Math.floor(
          (date - lastDate) / (1000 * 60 * 60 * 24)
        );

        if (dayDiff === 1) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }

      lastDate = date;
    }

    longestStreak = Math.max(longestStreak, currentStreak);

    return {
      longestStreak,
      currentStreak,
      totalDaysWithPlays: datesWithPlays.length,
    };
  } catch (error) {
    console.error("❌ Error calculating listening streaks:", error.message);
    throw error;
  }
}

/**
 * Get decade/year breakdown
 * Shows listening habits by release year
 */
export async function getListeningByDecade(userId) {
  await connectToDB();

  try {
    // Note: This requires track release year data in the Play schema
    // For now, returns a placeholder - you'd need to fetch release years from Spotify API
    console.log(
      "⚠️  getListeningByDecade requires track release year data"
    );
    return [];
  } catch (error) {
    console.error("❌ Error getting listening by decade:", error.message);
    throw error;
  }
}

/**
 * Get recently discovered artists
 * Artists with first play in the last X days
 */
export async function getRecentlyDiscoveredArtists(userId, days = 30) {
  await connectToDB();

  try {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const newArtists = await Play.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: {
            artistId: "$artistId",
            artistName: "$artistName",
          },
          firstPlayed: { $min: "$playedAt" },
          playCount: { $sum: 1 },
        },
      },
      { $match: { firstPlayed: { $gte: cutoffDate } } },
      { $sort: { firstPlayed: -1 } },
      {
        $project: {
          _id: 0,
          artistId: "$_id.artistId",
          artistName: "$_id.artistName",
          firstPlayed: 1,
          playCount: 1,
        },
      },
    ]);

    return newArtists;
  } catch (error) {
    console.error(
      "❌ Error getting recently discovered artists:",
      error.message
    );
    throw error;
  }
}
