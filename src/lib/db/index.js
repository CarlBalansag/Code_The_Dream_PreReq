export { prisma } from "../prisma.js";

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
  needsInitialImport,
} from "./user.js";

export {
  trackPlay,
  trackMultiplePlays,
  getRecentPlays,
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
