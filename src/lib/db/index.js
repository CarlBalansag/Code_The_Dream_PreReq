<<<<<<< HEAD
/**
 * Database API
 * Central export point for all database operations
 */

// Connection
export { connectToDB, disconnectFromDB, getConnectionStatus } from "../mongodb.js";

// Models
export { User } from "../models/User.js";
export { Play } from "../models/Play.js";
export { ImportJob } from "../models/ImportJob.js";

// User Operations
=======
export { prisma } from "../prisma.js";

>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
export {
  saveUser,
  getUserBySpotifyId,
  getUserByEmail,
  updateUserTokens,
  updateLastCheckTimestamp,
  markInitialImportComplete,
  markFullImportComplete,
  getAllUsers,
  deleteUser,
  getUserStats,
<<<<<<< HEAD
} from "./userOperations.js";

// Play Operations
=======
  needsInitialImport,
  updateBackgroundTracking,
  getBackgroundTrackingStatus,
  getUsersWithBackgroundTracking,
} from "./user.js";

>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
export {
  trackPlay,
  trackMultiplePlays,
  getRecentPlays,
<<<<<<< HEAD
  getPlaysByDateRange,
  getTotalPlays,
  getTotalListeningTime,
  getLastPlayTimestamp,
  deleteUserPlays,
  getPlayStats,
  getTrackPlays,
  getArtistPlays,
  getAlbumPlays,
} from "./playOperations.js";

// Stats Queries
export {
  getTopTracks,
  getTopArtists,
  getTopAlbums,
  getListeningTimeline,
  getComprehensiveStats,
  getStatsByPeriod,
  getListeningByDayOfWeek,
  getListeningByHourOfDay,
  getFirstListenDate,
  getListeningStreaks,
  getRecentlyDiscoveredArtists,
} from "./statsQueries.js";
=======
  countUserPlays,
  countUserPlaysInRange,
  getTopArtists,
  getArtistDailyHistory,
  getArtistFirstPlayDate,
  getArtistPlayCount,
} from "./play.js";

export {
  createJob,
  getJobById,
  getActiveJob,
  getUserJobs,
  markJobStarted,
  updateJobProgress,
  completeJob,
  failJob,
  cleanupOldJobs,
} from "./importJob.js";
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
