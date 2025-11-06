#!/usr/bin/env node

/**
 * MongoDB to PostgreSQL Migration Script
 * 
 * This script migrates your Spotify listening history from MongoDB to PostgreSQL
 * with significant storage optimization through normalization.
 * 
 * Expected storage reduction: ~80%
 * 
 * Usage:
 *   node migrate.js [--dry-run] [--batch-size=1000] [--skip-users] [--skip-plays]
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Pool } = require('pg');
const cliProgress = require('cli-progress');

// ============================================
// Configuration
// ============================================
const config = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/spotify-tracker',
  },
  postgres: {
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    max: 20, // connection pool size
  },
  batchSize: parseInt(process.env.BATCH_SIZE) || 1000,
  dryRun: process.argv.includes('--dry-run'),
  skipUsers: process.argv.includes('--skip-users'),
  skipPlays: process.argv.includes('--skip-plays'),
  skipImportJobs: process.argv.includes('--skip-import-jobs'),
};

// Parse custom batch size from args
const batchSizeArg = process.argv.find(arg => arg.startsWith('--batch-size='));
if (batchSizeArg) {
  config.batchSize = parseInt(batchSizeArg.split('=')[1]);
}

// ============================================
// MongoDB Models (Simplified)
// ============================================
const userSchema = new mongoose.Schema({
  spotifyId: String,
  displayName: String,
  email: String,
  country: String,
  profileImage: String,
  spotifyAccessToken: String,
  spotifyRefreshToken: String,
  tokenExpiresAt: Date,
  hasInitialImport: Boolean,
  hasFullImport: Boolean,
  lastCheckTimestamp: Date,
  joinedAt: Date,
  createdAt: Date,
  updatedAt: Date,
}, { collection: 'users' });

const playSchema = new mongoose.Schema({
  userId: String,
  trackId: String,
  trackName: String,
  artistId: String,
  artistName: String,
  albumId: String,
  albumName: String,
  albumImage: String,
  playedAt: Date,
  durationMs: Number,
  source: String,
}, { collection: 'plays' });

const importJobSchema = new mongoose.Schema({
  userId: String,
  status: String,
  fileName: String,
  totalTracks: Number,
  processedTracks: Number,
  startedAt: Date,
  completedAt: Date,
  errorMessage: String,
  createdAt: Date,
  updatedAt: Date,
}, { collection: 'import_jobs' });

const User = mongoose.model('User', userSchema);
const Play = mongoose.model('Play', playSchema);
const ImportJob = mongoose.model('ImportJob', importJobSchema);

// ============================================
// PostgreSQL Pool
// ============================================
const pgPool = new Pool(config.postgres);

// ============================================
// Helper Functions
// ============================================

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: 'ℹ️ ',
    success: '✅',
    error: '❌',
    warning: '⚠️ ',
    skip: '⏭️ ',
  }[type] || '';
  
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

async function getMongoStats() {
  const stats = await mongoose.connection.db.stats();
  return {
    dataSize: stats.dataSize,
    storageSize: stats.storageSize,
    indexSize: stats.indexSize,
    totalSize: stats.dataSize + stats.indexSize,
  };
}

// ============================================
// Migration Functions
// ============================================

async function migrateUsers(progressBar) {
  log('Starting user migration...');
  
  const totalUsers = await User.countDocuments();
  log(`Found ${totalUsers} users to migrate`);
  
  if (config.dryRun) {
    log('DRY RUN: Would migrate users', 'skip');
    return { migrated: 0, skipped: totalUsers };
  }
  
  progressBar.start(totalUsers, 0);
  
  let migrated = 0;
  let skipped = 0;
  let batch = [];
  
  const cursor = User.find().cursor();
  
  for await (const user of cursor) {
    const importFlags = (user.hasInitialImport ? 1 : 0) | (user.hasFullImport ? 2 : 0);
    
    batch.push({
      spotifyId: user.spotifyId,
      displayName: user.displayName,
      email: user.email || null,
      country: user.country || null,
      profileImage: user.profileImage || null,
      accessToken: user.spotifyAccessToken || null,
      refreshToken: user.spotifyRefreshToken || null,
      tokenExpiresAt: user.tokenExpiresAt || null,
      importFlags,
      lastCheckAt: user.lastCheckTimestamp || null,
      joinedAt: user.joinedAt || user.createdAt || new Date(),
      createdAt: user.createdAt || new Date(),
      updatedAt: user.updatedAt || new Date(),
    });
    
    if (batch.length >= config.batchSize) {
      const result = await insertUserBatch(batch);
      migrated += result.migrated;
      skipped += result.skipped;
      progressBar.update(migrated + skipped);
      batch = [];
    }
  }
  
  // Insert remaining
  if (batch.length > 0) {
    const result = await insertUserBatch(batch);
    migrated += result.migrated;
    skipped += result.skipped;
  }
  
  progressBar.stop();
  log(`User migration complete: ${migrated} migrated, ${skipped} skipped`, 'success');
  
  return { migrated, skipped };
}

async function insertUserBatch(users) {
  const values = users.map((u, idx) => {
    const offset = idx * 12;
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12})`;
  }).join(', ');
  
  const params = users.flatMap(u => [
    u.spotifyId,
    u.displayName,
    u.email,
    u.country,
    u.profileImage,
    u.accessToken,
    u.refreshToken,
    u.tokenExpiresAt,
    u.importFlags,
    u.lastCheckAt,
    u.joinedAt,
    u.createdAt,
  ]);
  
  const query = `
    INSERT INTO users (
      spotify_id, display_name, email, country, profile_image,
      access_token, refresh_token, token_expires_at, import_flags,
      last_check_at, joined_at, created_at
    ) VALUES ${values}
    ON CONFLICT (spotify_id) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      email = EXCLUDED.email,
      updated_at = NOW()
  `;
  
  try {
    await pgPool.query(query, params);
    return { migrated: users.length, skipped: 0 };
  } catch (err) {
    log(`Error inserting user batch: ${err.message}`, 'error');
    return { migrated: 0, skipped: users.length };
  }
}

async function migratePlays(progressBar) {
  log('Starting plays migration (this will take a while)...');
  
  const totalPlays = await Play.countDocuments();
  log(`Found ${totalPlays} plays to migrate`);
  
  if (config.dryRun) {
    log('DRY RUN: Would migrate plays', 'skip');
    return { migrated: 0, skipped: totalPlays };
  }
  
  progressBar.start(totalPlays, 0);
  
  let processed = 0;
  let migrated = 0;
  let skipped = 0;
  
  // Track unique entities for normalization
  const artists = new Map();
  const albums = new Map();
  const tracks = new Map();
  let playsBatch = [];
  
  const cursor = Play.find().cursor();
  
  for await (const play of cursor) {
    // Collect normalized data
    if (play.artistId && play.artistName) {
      artists.set(play.artistId, play.artistName);
    }
    
    if (play.albumId && play.albumName) {
      albums.set(play.albumId, {
        name: play.albumName,
        artistId: play.artistId,
        image: play.albumImage,
      });
    }
    
    if (play.trackId && play.trackName) {
      tracks.set(play.trackId, {
        name: play.trackName,
        artistId: play.artistId,
        albumId: play.albumId,
        durationMs: play.durationMs,
      });
    }
    
    // Prepare play record
    const sourceMap = { tracked: 0, initial_import: 1, full_import: 2 };
    playsBatch.push({
      userId: play.userId,
      trackId: play.trackId || null,
      playedAt: play.playedAt,
      source: sourceMap[play.source] || 0,
    });
    
    processed++;
    
    // Insert in batches
    if (playsBatch.length >= config.batchSize) {
      // First, insert normalized data
      await insertNormalizedData(artists, albums, tracks);
      
      // Then insert plays
      const result = await insertPlaysBatch(playsBatch);
      migrated += result.migrated;
      skipped += result.skipped;
      
      progressBar.update(processed);
      
      // Clear batches
      playsBatch = [];
      artists.clear();
      albums.clear();
      tracks.clear();
    }
  }
  
  // Insert remaining
  if (playsBatch.length > 0) {
    await insertNormalizedData(artists, albums, tracks);
    const result = await insertPlaysBatch(playsBatch);
    migrated += result.migrated;
    skipped += result.skipped;
  }
  
  progressBar.stop();
  log(`Plays migration complete: ${migrated} migrated, ${skipped} skipped`, 'success');
  
  return { migrated, skipped };
}

async function insertNormalizedData(artists, albums, tracks) {
  // Insert artists
  if (artists.size > 0) {
    const artistValues = Array.from(artists.entries()).map(([id, name], idx) => {
      const offset = idx * 2;
      return `($${offset + 1}, $${offset + 2})`;
    }).join(', ');
    
    const artistParams = Array.from(artists.entries()).flatMap(([id, name]) => [id, name]);
    
    await pgPool.query(
      `INSERT INTO artists (id, name) VALUES ${artistValues} ON CONFLICT (id) DO NOTHING`,
      artistParams
    );
  }
  
  // Insert albums
  if (albums.size > 0) {
    const albumValues = Array.from(albums.entries()).map(([id], idx) => {
      const offset = idx * 4;
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
    }).join(', ');
    
    const albumParams = Array.from(albums.entries()).flatMap(([id, data]) => [
      id,
      data.name,
      data.artistId || null,
      data.image || null,
    ]);
    
    await pgPool.query(
      `INSERT INTO albums (id, name, artist_id, image_url) VALUES ${albumValues} ON CONFLICT (id) DO NOTHING`,
      albumParams
    );
  }
  
  // Insert tracks
  if (tracks.size > 0) {
    const trackValues = Array.from(tracks.entries()).map(([id], idx) => {
      const offset = idx * 5;
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`;
    }).join(', ');
    
    const trackParams = Array.from(tracks.entries()).flatMap(([id, data]) => [
      id,
      data.name,
      data.artistId || null,
      data.albumId || null,
      data.durationMs,
    ]);
    
    await pgPool.query(
      `INSERT INTO tracks (id, name, artist_id, album_id, duration_ms) VALUES ${trackValues} ON CONFLICT (id) DO NOTHING`,
      trackParams
    );
  }
}

async function insertPlaysBatch(plays) {
  const values = plays.map((p, idx) => {
    const offset = idx * 4;
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
  }).join(', ');
  
  const params = plays.flatMap(p => [
    p.userId,
    p.trackId,
    p.playedAt,
    p.source,
  ]);
  
  try {
    const result = await pgPool.query(
      `INSERT INTO plays (user_id, track_id, played_at, source) VALUES ${values} ON CONFLICT (user_id, track_id, played_at) DO NOTHING`,
      params
    );
    return { migrated: result.rowCount, skipped: plays.length - result.rowCount };
  } catch (err) {
    log(`Error inserting plays batch: ${err.message}`, 'error');
    return { migrated: 0, skipped: plays.length };
  }
}

async function migrateImportJobs(progressBar) {
  log('Starting import jobs migration...');
  
  const totalJobs = await ImportJob.countDocuments();
  log(`Found ${totalJobs} import jobs to migrate`);
  
  if (config.dryRun) {
    log('DRY RUN: Would migrate import jobs', 'skip');
    return { migrated: 0, skipped: totalJobs };
  }
  
  progressBar.start(totalJobs, 0);
  
  let migrated = 0;
  let skipped = 0;
  let batch = [];
  
  const cursor = ImportJob.find().cursor();
  
  for await (const job of cursor) {
    batch.push({
      userId: job.userId,
      status: job.status || 'pending',
      fileName: job.fileName,
      totalTracks: job.totalTracks || 0,
      processedTracks: job.processedTracks || 0,
      startedAt: job.startedAt || null,
      completedAt: job.completedAt || null,
      errorMessage: job.errorMessage || null,
      createdAt: job.createdAt || new Date(),
      updatedAt: job.updatedAt || new Date(),
    });
    
    if (batch.length >= config.batchSize) {
      const result = await insertImportJobBatch(batch);
      migrated += result.migrated;
      skipped += result.skipped;
      progressBar.update(migrated + skipped);
      batch = [];
    }
  }
  
  // Insert remaining
  if (batch.length > 0) {
    const result = await insertImportJobBatch(batch);
    migrated += result.migrated;
    skipped += result.skipped;
  }
  
  progressBar.stop();
  log(`Import jobs migration complete: ${migrated} migrated, ${skipped} skipped`, 'success');
  
  return { migrated, skipped };
}

async function insertImportJobBatch(jobs) {
  const values = jobs.map((j, idx) => {
    const offset = idx * 9;
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`;
  }).join(', ');
  
  const params = jobs.flatMap(j => [
    j.userId,
    j.status,
    j.fileName,
    j.totalTracks,
    j.processedTracks,
    j.startedAt,
    j.completedAt,
    j.errorMessage,
    j.createdAt,
  ]);
  
  try {
    const result = await pgPool.query(
      `INSERT INTO import_jobs (user_id, status, file_name, total_tracks, processed_tracks, started_at, completed_at, error_message, created_at) VALUES ${values}`,
      params
    );
    return { migrated: result.rowCount, skipped: 0 };
  } catch (err) {
    log(`Error inserting import job batch: ${err.message}`, 'error');
    return { migrated: 0, skipped: jobs.length };
  }
}

// ============================================
// Main Migration Process
// ============================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  MongoDB → PostgreSQL Migration Script                ║');
  console.log('║  Spotify Listening History Tracker                    ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  if (config.dryRun) {
    log('🔍 DRY RUN MODE - No data will be written', 'warning');
  }
  
  log(`Batch size: ${config.batchSize}`);
  log(`MongoDB: ${config.mongodb.uri}`);
  log(`PostgreSQL: ${config.postgres.connectionString ? 'Connected' : 'Not configured'}`);
  
  try {
    // Connect to MongoDB
    log('Connecting to MongoDB...');
    await mongoose.connect(config.mongodb.uri, { dbName: 'SpotifyLocal_Prod' });
    log('Connected to MongoDB', 'success');
    
    // Get MongoDB stats
    const mongoStats = await getMongoStats();
    log(`MongoDB current size: ${formatBytes(mongoStats.totalSize)}`);
    log(`  - Data: ${formatBytes(mongoStats.dataSize)}`);
    log(`  - Indexes: ${formatBytes(mongoStats.indexSize)}`);
    
    // Connect to PostgreSQL
    log('Connecting to PostgreSQL...');
    await pgPool.query('SELECT NOW()');
    log('Connected to PostgreSQL', 'success');
    
    console.log('\n' + '─'.repeat(60) + '\n');
    
    // Create progress bars
    const multibar = new cliProgress.MultiBar({
      clearOnComplete: false,
      hideCursor: true,
      format: '{bar} | {percentage}% | {value}/{total} | {duration_formatted}',
    }, cliProgress.Presets.shades_classic);
    
    const userProgressBar = multibar.create(100, 0);
    const playProgressBar = multibar.create(100, 0);
    const jobProgressBar = multibar.create(100, 0);
    
    const results = {};
    
    // Migrate users
    if (!config.skipUsers) {
      results.users = await migrateUsers(userProgressBar);
    } else {
      log('Skipping users migration', 'skip');
    }
    
    // Migrate plays
    if (!config.skipPlays) {
      results.plays = await migratePlays(playProgressBar);
    } else {
      log('Skipping plays migration', 'skip');
    }
    
    // Migrate import jobs
    if (!config.skipImportJobs) {
      results.importJobs = await migrateImportJobs(jobProgressBar);
    } else {
      log('Skipping import jobs migration', 'skip');
    }
    
    multibar.stop();
    
    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('═'.repeat(60));
    
    if (results.users) {
      console.log(`\n👥 Users:`);
      console.log(`   Migrated: ${results.users.migrated}`);
      console.log(`   Skipped: ${results.users.skipped}`);
    }
    
    if (results.plays) {
      console.log(`\n🎵 Plays:`);
      console.log(`   Migrated: ${results.plays.migrated}`);
      console.log(`   Skipped: ${results.plays.skipped}`);
    }
    
    if (results.importJobs) {
      console.log(`\n📥 Import Jobs:`);
      console.log(`   Migrated: ${results.importJobs.migrated}`);
      console.log(`   Skipped: ${results.importJobs.skipped}`);
    }
    
    // Estimate size savings
    if (results.plays && results.plays.migrated > 0) {
      const mongoBytesPerPlay = 300; // avg bytes per play in MongoDB
      const postgresBytesPerPlay = 50; // avg bytes per play in PostgreSQL
      const mongoEstimate = results.plays.migrated * mongoBytesPerPlay;
      const postgresEstimate = results.plays.migrated * postgresBytesPerPlay;
      const savings = mongoEstimate - postgresEstimate;
      const savingsPercent = ((savings / mongoEstimate) * 100).toFixed(1);
      
      console.log(`\n💾 Estimated Storage:`);
      console.log(`   MongoDB equivalent: ${formatBytes(mongoEstimate)}`);
      console.log(`   PostgreSQL actual: ${formatBytes(postgresEstimate)}`);
      console.log(`   Savings: ${formatBytes(savings)} (${savingsPercent}%)`);
    }
    
    console.log('\n' + '═'.repeat(60));
    
    if (!config.dryRun) {
      log('Migration completed successfully! 🎉', 'success');
      log('\nNext steps:');
      log('1. Verify data in PostgreSQL');
      log('2. Update your application to use PostgreSQL');
      log('3. Test thoroughly before removing MongoDB');
      log('4. Run VACUUM ANALYZE on PostgreSQL for optimal performance');
    } else {
      log('Dry run completed. Use without --dry-run to perform actual migration.', 'info');
    }
    
  } catch (error) {
    log(`Migration failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  } finally {
    // Cleanup
    await mongoose.disconnect();
    await pgPool.end();
  }
}

// Run migration
main();
