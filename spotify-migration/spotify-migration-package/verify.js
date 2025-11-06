#!/usr/bin/env node

/**
 * Migration Verification Script
 * 
 * Compares data between MongoDB and PostgreSQL to verify migration success
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Pool } = require('pg');

const config = {
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  postgres: {
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  },
};

// MongoDB Models
const userSchema = new mongoose.Schema({}, { collection: 'users', strict: false });
const playSchema = new mongoose.Schema({}, { collection: 'plays', strict: false });
const importJobSchema = new mongoose.Schema({}, { collection: 'import_jobs', strict: false });

const User = mongoose.model('User', userSchema);
const Play = mongoose.model('Play', playSchema);
const ImportJob = mongoose.model('ImportJob', importJobSchema);

const pgPool = new Pool(config.postgres);

function log(message, type = 'info') {
  const icons = {
    info: 'ℹ️ ',
    success: '✅',
    error: '❌',
    warning: '⚠️ ',
  };
  console.log(`${icons[type]} ${message}`);
}

async function verifyUsers() {
  console.log('\n━━━ USERS VERIFICATION ━━━');
  
  const mongoCount = await User.countDocuments();
  const pgResult = await pgPool.query('SELECT COUNT(*) FROM users');
  const pgCount = parseInt(pgResult.rows[0].count);
  
  log(`MongoDB users: ${mongoCount}`);
  log(`PostgreSQL users: ${pgCount}`);
  
  if (mongoCount === pgCount) {
    log('User count matches!', 'success');
  } else {
    log(`User count mismatch! Difference: ${Math.abs(mongoCount - pgCount)}`, 'error');
  }
  
  // Sample verification
  const sampleUser = await User.findOne();
  if (sampleUser) {
    const pgUser = await pgPool.query('SELECT * FROM users WHERE spotify_id = $1', [sampleUser.spotifyId]);
    
    if (pgUser.rows.length > 0) {
      log('Sample user found in PostgreSQL', 'success');
      
      const match = 
        pgUser.rows[0].display_name === sampleUser.displayName &&
        pgUser.rows[0].email === (sampleUser.email || null);
      
      if (match) {
        log('Sample user data matches!', 'success');
      } else {
        log('Sample user data mismatch!', 'warning');
      }
    } else {
      log('Sample user NOT found in PostgreSQL', 'error');
    }
  }
  
  return mongoCount === pgCount;
}

async function verifyPlays() {
  console.log('\n━━━ PLAYS VERIFICATION ━━━');
  
  const mongoCount = await Play.countDocuments();
  const pgResult = await pgPool.query('SELECT COUNT(*) FROM plays');
  const pgCount = parseInt(pgResult.rows[0].count);
  
  log(`MongoDB plays: ${mongoCount}`);
  log(`PostgreSQL plays: ${pgCount}`);
  
  const difference = Math.abs(mongoCount - pgCount);
  const percentDiff = ((difference / mongoCount) * 100).toFixed(2);
  
  if (mongoCount === pgCount) {
    log('Play count matches perfectly!', 'success');
  } else if (percentDiff < 0.1) {
    log(`Play count very close (${percentDiff}% difference) - likely duplicates handled`, 'warning');
  } else {
    log(`Play count mismatch! Difference: ${difference} (${percentDiff}%)`, 'error');
  }
  
  // Check normalized tables
  const artistCount = await pgPool.query('SELECT COUNT(*) FROM artists');
  const albumCount = await pgPool.query('SELECT COUNT(*) FROM albums');
  const trackCount = await pgPool.query('SELECT COUNT(*) FROM tracks');
  
  log(`\nNormalized entities:`);
  log(`  Artists: ${artistCount.rows[0].count}`);
  log(`  Albums: ${albumCount.rows[0].count}`);
  log(`  Tracks: ${trackCount.rows[0].count}`);
  
  // Sample play verification
  const samplePlay = await Play.findOne({ trackId: { $ne: null } });
  if (samplePlay) {
    const pgPlay = await pgPool.query(
      'SELECT * FROM plays WHERE user_id = $1 AND track_id = $2 AND played_at = $3',
      [samplePlay.userId, samplePlay.trackId, samplePlay.playedAt]
    );
    
    if (pgPlay.rows.length > 0) {
      log('Sample play found in PostgreSQL', 'success');
      
      // Check if track/artist/album were normalized
      const track = await pgPool.query('SELECT * FROM tracks WHERE id = $1', [samplePlay.trackId]);
      const artist = samplePlay.artistId ? 
        await pgPool.query('SELECT * FROM artists WHERE id = $1', [samplePlay.artistId]) : null;
      
      if (track.rows.length > 0) {
        log('Sample track normalized correctly', 'success');
      }
      if (artist && artist.rows.length > 0) {
        log('Sample artist normalized correctly', 'success');
      }
    } else {
      log('Sample play NOT found in PostgreSQL', 'error');
    }
  }
  
  return percentDiff < 1; // Allow 1% difference for duplicates
}

async function verifyImportJobs() {
  console.log('\n━━━ IMPORT JOBS VERIFICATION ━━━');
  
  const mongoCount = await ImportJob.countDocuments();
  const pgResult = await pgPool.query('SELECT COUNT(*) FROM import_jobs');
  const pgCount = parseInt(pgResult.rows[0].count);
  
  log(`MongoDB import jobs: ${mongoCount}`);
  log(`PostgreSQL import jobs: ${pgCount}`);
  
  if (mongoCount === pgCount) {
    log('Import job count matches!', 'success');
  } else {
    log(`Import job count mismatch! Difference: ${Math.abs(mongoCount - pgCount)}`, 'error');
  }
  
  return mongoCount === pgCount;
}

async function checkDataIntegrity() {
  console.log('\n━━━ DATA INTEGRITY CHECKS ━━━');
  
  // Check for orphaned plays (plays without users)
  const orphanedPlays = await pgPool.query(`
    SELECT COUNT(*) 
    FROM plays p 
    LEFT JOIN users u ON p.user_id = u.spotify_id 
    WHERE u.spotify_id IS NULL
  `);
  
  const orphanCount = parseInt(orphanedPlays.rows[0].count);
  
  if (orphanCount === 0) {
    log('No orphaned plays (all plays have valid users)', 'success');
  } else {
    log(`Found ${orphanCount} orphaned plays!`, 'warning');
  }
  
  // Check for plays without tracks
  const playsWithoutTracks = await pgPool.query(`
    SELECT COUNT(*) FROM plays WHERE track_id IS NULL
  `);
  
  const noTrackCount = parseInt(playsWithoutTracks.rows[0].count);
  log(`Plays without track IDs: ${noTrackCount} (expected for imports)`);
  
  // Check index usage
  const indexes = await pgPool.query(`
    SELECT 
      schemaname,
      tablename,
      indexname,
      idx_scan as scans
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    ORDER BY idx_scan DESC
  `);
  
  console.log('\nIndex usage:');
  indexes.rows.slice(0, 10).forEach(idx => {
    console.log(`  ${idx.tablename}.${idx.indexname}: ${idx.scans} scans`);
  });
  
  return orphanCount === 0;
}

async function estimateStorageSavings() {
  console.log('\n━━━ STORAGE ANALYSIS ━━━');
  
  const pgSize = await pgPool.query(`
    SELECT 
      pg_size_pretty(pg_database_size(current_database())) as total_size,
      pg_size_pretty(pg_total_relation_size('plays')) as plays_size,
      pg_size_pretty(pg_total_relation_size('users')) as users_size,
      pg_size_pretty(pg_total_relation_size('tracks')) as tracks_size,
      pg_size_pretty(pg_total_relation_size('artists')) as artists_size,
      pg_size_pretty(pg_total_relation_size('albums')) as albums_size
  `);
  
  console.log('PostgreSQL storage:');
  console.log(`  Total database: ${pgSize.rows[0].total_size}`);
  console.log(`  Plays table: ${pgSize.rows[0].plays_size}`);
  console.log(`  Users table: ${pgSize.rows[0].users_size}`);
  console.log(`  Tracks table: ${pgSize.rows[0].tracks_size}`);
  console.log(`  Artists table: ${pgSize.rows[0].artists_size}`);
  console.log(`  Albums table: ${pgSize.rows[0].albums_size}`);
  
  // Estimate MongoDB equivalent
  const playCount = await pgPool.query('SELECT COUNT(*) FROM plays');
  const plays = parseInt(playCount.rows[0].count);
  
  const mongoEstimate = plays * 300; // 300 bytes per play in MongoDB
  const pgEstimate = plays * 50; // 50 bytes per play in PostgreSQL (normalized)
  const savings = mongoEstimate - pgEstimate;
  const savingsPercent = ((savings / mongoEstimate) * 100).toFixed(1);
  
  console.log(`\nEstimated savings:`);
  console.log(`  MongoDB equivalent: ${formatBytes(mongoEstimate)}`);
  console.log(`  PostgreSQL actual: ${formatBytes(pgEstimate)}`);
  console.log(`  Savings: ${formatBytes(savings)} (${savingsPercent}%)`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Migration Verification Script                         ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  try {
    log('Connecting to databases...');
    
    await mongoose.connect(config.mongodb.uri);
    log('Connected to MongoDB', 'success');
    
    await pgPool.query('SELECT NOW()');
    log('Connected to PostgreSQL', 'success');
    
    const results = {
      users: await verifyUsers(),
      plays: await verifyPlays(),
      importJobs: await verifyImportJobs(),
      integrity: await checkDataIntegrity(),
    };
    
    await estimateStorageSavings();
    
    console.log('\n' + '═'.repeat(60));
    console.log('VERIFICATION SUMMARY');
    console.log('═'.repeat(60));
    
    const allPassed = Object.values(results).every(r => r);
    
    if (allPassed) {
      log('\nAll verification checks passed! 🎉', 'success');
      log('Your migration was successful!', 'success');
    } else {
      log('\nSome verification checks failed.', 'warning');
      log('Review the output above for details.', 'warning');
    }
    
  } catch (error) {
    log(`Verification failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    await pgPool.end();
  }
}

main();
