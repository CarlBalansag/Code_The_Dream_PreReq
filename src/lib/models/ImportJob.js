import mongoose from "mongoose";

/**
 * ImportJob Schema
 * Tracks progress when users import their full Spotify history from ZIP files
 */
const importJobSchema = new mongoose.Schema(
  {
    // User reference (links to User.spotifyId)
    userId: {
      type: String,
      required: true,
      index: true,
    },

    // Job status
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },

    // File information
    fileName: {
      type: String,
      required: true,
    },

    // Progress tracking
    totalTracks: {
      type: Number,
      default: 0,
    },

    processedTracks: {
      type: Number,
      default: 0,
    },

    // Timing
    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    // Error handling
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: "import_jobs",
  }
);

// Indexes
importJobSchema.index({ userId: 1, status: 1 });
importJobSchema.index({ createdAt: -1 });

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Mark job as started
 */
importJobSchema.methods.start = function () {
  this.status = "processing";
  this.startedAt = new Date();
  return this.save();
};

/**
 * Update progress
 */
importJobSchema.methods.updateProgress = function (processedTracks) {
  this.processedTracks = processedTracks;
  return this.save();
};

/**
 * Mark job as completed
 */
importJobSchema.methods.complete = function () {
  this.status = "completed";
  this.completedAt = new Date();
  this.processedTracks = this.totalTracks;
  return this.save();
};

/**
 * Mark job as failed
 */
importJobSchema.methods.fail = function (errorMessage) {
  this.status = "failed";
  this.completedAt = new Date();
  this.errorMessage = errorMessage;
  return this.save();
};

/**
 * Get progress percentage
 */
importJobSchema.methods.getProgress = function () {
  if (this.totalTracks === 0) return 0;
  return Math.round((this.processedTracks / this.totalTracks) * 100);
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get active import job for user
 */
importJobSchema.statics.getActiveJob = function (userId) {
  return this.findOne({
    userId,
    status: { $in: ["pending", "processing"] },
  }).sort({ createdAt: -1 });
};

/**
 * Get all jobs for user
 */
importJobSchema.statics.getUserJobs = function (userId, limit = 10) {
  return this.find({ userId }).sort({ createdAt: -1 }).limit(limit);
};

/**
 * Get job by ID
 */
importJobSchema.statics.getJobById = function (jobId) {
  return this.findById(jobId);
};

/**
 * Create new import job
 */
importJobSchema.statics.createJob = function (userId, fileName, totalTracks) {
  return this.create({
    userId,
    fileName,
    totalTracks,
    status: "pending",
  });
};

/**
 * Clean up old completed jobs (keep only last 5 per user)
 */
importJobSchema.statics.cleanupOldJobs = async function (userId) {
  const jobs = await this.find({
    userId,
    status: { $in: ["completed", "failed"] },
  })
    .sort({ completedAt: -1 })
    .skip(5);

  if (jobs.length > 0) {
    const jobIds = jobs.map((job) => job._id);
    await this.deleteMany({ _id: { $in: jobIds } });
    return jobs.length;
  }

  return 0;
};

// Prevent model recompilation in development (Next.js hot reload)
export const ImportJob =
  mongoose.models.ImportJob || mongoose.model("ImportJob", importJobSchema);
