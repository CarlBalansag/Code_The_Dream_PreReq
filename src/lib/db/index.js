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
} from "./userOperations.js";

// Play Operations
export {
  trackPlay,
  trackMultiplePlays,
  getRecentPlays,
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
