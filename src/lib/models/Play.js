import mongoose from "mongoose";

/**
 * Play Schema
 * Records every single song play - this will scale to millions of documents
 * CRITICAL: Proper indexes are essential for performance
 */
const playSchema = new mongoose.Schema(
  {
    // User reference (links to User.spotifyId)
    userId: {
      type: String,
      required: true,
      index: true, // CRITICAL: Most queries filter by userId
    },

    // Track information
    trackId: {
      type: String,
      required: false, // Can be null for imported data without Spotify IDs
      index: true,
    },

    trackName: {
      type: String,
      required: true,
    },

    // Artist information
    artistId: {
      type: String,
      required: false, // Can be null for imported data without Spotify IDs
      index: true,
    },

    artistName: {
      type: String,
      required: true,
    },

    // Album information
    albumId: {
      type: String,
      required: false, // Can be null for imported data without album info
    },

    albumName: {
      type: String,
      required: false, // Can be null for imported data without album info
    },

    albumImage: {
      type: String,
      required: false,
    },

    // Timing information
    playedAt: {
      type: Date,
      required: true,
      index: true, // CRITICAL: Used for date range queries and sorting
    },

    durationMs: {
      type: Number,
      required: true,
    },

    // Track where this play came from
    source: {
      type: String,
      enum: ["tracked", "initial_import", "full_import"],
      default: "tracked",
    },
  },
  {
    timestamps: false, // We use playedAt instead
    collection: "plays",
  }
);

// ============================================
// CRITICAL INDEXES FOR PERFORMANCE
// ============================================

// Compound index: userId + playedAt (descending)
// This is THE most important index - covers 90% of queries
playSchema.index({ userId: 1, playedAt: -1 });

// Individual indexes for filtering
playSchema.index({ userId: 1, trackId: 1 });
playSchema.index({ userId: 1, artistId: 1 });
playSchema.index({ userId: 1, albumId: 1 });

// For finding duplicates (prevent double-counting same play)
playSchema.index({ userId: 1, trackId: 1, playedAt: 1 }, { unique: true });

// ============================================
// STATIC METHODS FOR COMMON QUERIES
// ============================================

/**
 * Get user's total play count
 */
playSchema.statics.getTotalPlays = function (userId) {
  return this.countDocuments({ userId });
};

/**
 * Get user's total listening time in milliseconds
 */
playSchema.statics.getTotalListeningTime = async function (userId) {
  const result = await this.aggregate([
    { $match: { userId } },
    { $group: { _id: null, totalMs: { $sum: "$durationMs" } } },
  ]);
  return result.length > 0 ? result[0].totalMs : 0;
};

/**
 * Get user's top tracks with play counts
 * @param {string} userId - User's Spotify ID
 * @param {Date} startDate - Optional start date
 * @param {Date} endDate - Optional end date
 * @param {number} limit - Number of results (default 50)
 */
playSchema.statics.getTopTracks = async function (
  userId,
  { startDate = null, endDate = null, limit = 50 } = {}
) {
  const matchStage = { userId };

  if (startDate || endDate) {
    matchStage.playedAt = {};
    if (startDate) matchStage.playedAt.$gte = startDate;
    if (endDate) matchStage.playedAt.$lte = endDate;
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          trackId: "$trackId",
          trackName: "$trackName",
          artistName: "$artistName",
          albumName: "$albumName",
          albumImage: "$albumImage",
        },
        playCount: { $sum: 1 },
        totalDurationMs: { $sum: "$durationMs" },
        firstPlayed: { $min: "$playedAt" },
        lastPlayed: { $max: "$playedAt" },
      },
    },
    { $sort: { playCount: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        trackId: "$_id.trackId",
        trackName: "$_id.trackName",
        artistName: "$_id.artistName",
        albumName: "$_id.albumName",
        albumImage: "$_id.albumImage",
        playCount: 1,
        totalDurationMs: 1,
        firstPlayed: 1,
        lastPlayed: 1,
      },
    },
  ]);
};

/**
 * Get user's top artists with play counts
 */
playSchema.statics.getTopArtists = async function (
  userId,
  { startDate = null, endDate = null, limit = 50 } = {}
) {
  const matchStage = { userId };

  if (startDate || endDate) {
    matchStage.playedAt = {};
    if (startDate) matchStage.playedAt.$gte = startDate;
    if (endDate) matchStage.playedAt.$lte = endDate;
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        // Group by artistName only (to handle null artistIds)
        // Keep the first non-null artistId we find for each artist
        _id: "$artistName",
        artistId: {
          $first: {
            $cond: [{ $ne: ["$artistId", null] }, "$artistId", null]
          }
        },
        playCount: { $sum: 1 },
        totalDurationMs: { $sum: "$durationMs" },
        firstPlayed: { $min: "$playedAt" },
        lastPlayed: { $max: "$playedAt" },
        uniqueTracks: { $addToSet: "$trackId" },
      },
    },
    { $sort: { playCount: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        artistId: 1,
        artistName: "$_id",
        playCount: 1,
        totalDurationMs: 1,
        firstPlayed: 1,
        lastPlayed: 1,
        uniqueTrackCount: { $size: "$uniqueTracks" },
      },
    },
  ]);
};

/**
 * Get user's top albums with play counts
 */
playSchema.statics.getTopAlbums = async function (
  userId,
  { startDate = null, endDate = null, limit = 50 } = {}
) {
  const matchStage = { userId };

  if (startDate || endDate) {
    matchStage.playedAt = {};
    if (startDate) matchStage.playedAt.$gte = startDate;
    if (endDate) matchStage.playedAt.$lte = endDate;
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          albumId: "$albumId",
          albumName: "$albumName",
          artistName: "$artistName",
          albumImage: "$albumImage",
        },
        playCount: { $sum: 1 },
        totalDurationMs: { $sum: "$durationMs" },
        firstPlayed: { $min: "$playedAt" },
        lastPlayed: { $max: "$playedAt" },
        uniqueTracks: { $addToSet: "$trackId" },
      },
    },
    { $sort: { playCount: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        albumId: "$_id.albumId",
        albumName: "$_id.albumName",
        artistName: "$_id.artistName",
        albumImage: "$_id.albumImage",
        playCount: 1,
        totalDurationMs: 1,
        firstPlayed: 1,
        lastPlayed: 1,
        uniqueTrackCount: { $size: "$uniqueTracks" },
      },
    },
  ]);
};

/**
 * Get recent plays for a user
 */
playSchema.statics.getRecentPlays = function (userId, limit = 50) {
  return this.find({ userId })
    .sort({ playedAt: -1 })
    .limit(limit)
    .select("-__v");
};

/**
 * Get listening history timeline (plays grouped by month)
 */
playSchema.statics.getListeningTimeline = async function (userId) {
  return this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: {
          year: { $year: "$playedAt" },
          month: { $month: "$playedAt" },
        },
        playCount: { $sum: 1 },
        totalDurationMs: { $sum: "$durationMs" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        playCount: 1,
        totalDurationMs: 1,
      },
    },
  ]);
};

/**
 * Check if a play already exists (prevent duplicates)
 */
playSchema.statics.playExists = async function (userId, trackId, playedAt) {
  const exists = await this.findOne({ userId, trackId, playedAt });
  return !!exists;
};

/**
 * Bulk insert plays (for importing history)
 * Uses insertMany with ordered: false to skip duplicates
 */
playSchema.statics.bulkInsertPlays = async function (plays) {
  try {
    const result = await this.insertMany(plays, {
      ordered: false, // Continue on duplicate key errors
    });
    return {
      success: true,
      inserted: result.length,
    };
  } catch (error) {
    // Handle duplicate key errors
    if (error.code === 11000) {
      const inserted = error.insertedDocs ? error.insertedDocs.length : 0;
      return {
        success: true,
        inserted,
        duplicates: plays.length - inserted,
      };
    }
    throw error;
  }
};

// Prevent model recompilation in development (Next.js hot reload)
export const Play =
  mongoose.models.Play || mongoose.model("Play", playSchema);
