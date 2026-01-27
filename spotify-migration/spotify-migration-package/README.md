# MongoDB to PostgreSQL Migration Guide

Complete migration toolkit for moving your Spotify Listening History Tracker from MongoDB to PostgreSQL with **~80% storage reduction**.

## 📦 What's Included

```
migration/
├── schema.sql          # PostgreSQL schema with optimized tables
├── migrate.js          # Main migration script
├── verify.js           # Verification script to check migration success
├── package.json        # Dependencies
├── .env.example        # Configuration template
└── README.md          # This file
```

## 🎯 Expected Results

- **Storage reduction**: 80% (300 bytes → 50 bytes per play)
- **Query performance**: Similar or better with proper indexes
- **Data normalization**: Eliminates repeated track/artist/album names
- **Free tier options**: Multiple databases with generous free storage

### Example Savings:
| Plays | MongoDB Size | PostgreSQL Size | Savings |
|-------|--------------|-----------------|---------|
| 100K  | 30 MB        | 5 MB            | 25 MB   |
| 1M    | 300 MB       | 50 MB           | 250 MB  |
| 10M   | 3 GB         | 500 MB          | 2.5 GB  |

## 🚀 Quick Start

### Step 1: Choose a PostgreSQL Provider

Pick one of these free options:

**Option A: Supabase (Recommended)**
- 500MB free storage
- Built-in auth & storage
- Auto-backups
- [Sign up](https://supabase.com)

**Option B: Neon**
- 512MB free storage
- Branching for dev/staging
- Instant cold starts
- [Sign up](https://neon.tech)

**Option C: Vercel Postgres**
- 256MB free storage
- Perfect if using Vercel for hosting
- [Sign up](https://vercel.com/storage/postgres)

**Option D: Railway**
- 512MB free (previously unlimited)
- Easy deployment
- [Sign up](https://railway.app)

### Step 2: Set Up PostgreSQL

#### Using Supabase:
1. Create new project at https://supabase.com
2. Go to Project Settings → Database
3. Copy connection string (starts with `postgresql://`)
4. Save it for Step 4

#### Using Neon:
1. Create new project at https://neon.tech
2. Copy connection string from dashboard
3. Note: Includes `?sslmode=require` at the end

### Step 3: Install Dependencies

```bash
cd migration
npm install
```

### Step 4: Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your database URLs
nano .env
```

**Example .env file:**
```env
# Your existing MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/spotify-tracker

# Your new PostgreSQL (from Step 2)
DATABASE_URL=postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres

# Optional: Adjust batch size (higher = faster but more memory)
BATCH_SIZE=1000
```

### Step 5: Create PostgreSQL Schema

```bash
# Option A: Using npm script
npm run setup:postgres

# Option B: Using psql directly
psql $DATABASE_URL -f schema.sql

# Option C: Copy-paste into Supabase SQL Editor
# (Go to SQL Editor in Supabase dashboard, paste schema.sql contents)
```

**Verify schema creation:**
```bash
psql $DATABASE_URL -c "\dt"
```

You should see:
```
 Schema |    Name     | Type  |
--------|-------------|-------|
 public | albums      | table |
 public | artists     | table |
 public | import_jobs | table |
 public | plays       | table |
 public | tracks      | table |
 public | users       | table |
```

### Step 6: Test Migration (Dry Run)

**IMPORTANT**: Always run a dry run first!

```bash
npm run migrate:dry-run
```

This will:
- Connect to both databases
- Show how many records would be migrated
- Estimate storage savings
- NOT write any data

**Example output:**
```
ℹ️  [2025-11-06] DRY RUN MODE - No data will be written
✅ [2025-11-06] Connected to MongoDB
✅ [2025-11-06] Connected to PostgreSQL
ℹ️  [2025-11-06] Found 50 users to migrate
ℹ️  [2025-11-06] Found 1,234,567 plays to migrate
⏭️  [2025-11-06] DRY RUN: Would migrate users
⏭️  [2025-11-06] DRY RUN: Would migrate plays

Estimated Storage:
   MongoDB equivalent: 370.37 MB
   PostgreSQL actual: 58.97 MB
   Savings: 311.4 MB (84.1%)
```

### Step 7: Run Full Migration

```bash
npm run migrate
```

**Migration will:**
1. ✅ Migrate all users with OAuth tokens
2. ✅ Extract unique artists/albums/tracks (normalization)
3. ✅ Migrate all plays with references only
4. ✅ Migrate import job history
5. ✅ Handle duplicates automatically
6. ✅ Show real-time progress bars

**This may take a while for large datasets:**
- 100K plays: ~2-5 minutes
- 1M plays: ~20-30 minutes
- 10M plays: ~3-4 hours

### Step 8: Verify Migration

```bash
npm run verify
```

**Checks:**
- ✅ User count matches
- ✅ Play count matches (or very close)
- ✅ Sample data integrity
- ✅ No orphaned records
- ✅ Normalized entities created
- ✅ Storage savings achieved

**Example output:**
```
━━━ USERS VERIFICATION ━━━
✅ MongoDB users: 50
✅ PostgreSQL users: 50
✅ User count matches!

━━━ PLAYS VERIFICATION ━━━
✅ MongoDB plays: 1,234,567
✅ PostgreSQL plays: 1,234,321
⚠️  Play count very close (0.02% difference) - likely duplicates handled

Normalized entities:
  Artists: 15,234
  Albums: 23,456
  Tracks: 87,654

━━━ DATA INTEGRITY CHECKS ━━━
✅ No orphaned plays (all plays have valid users)

━━━ STORAGE ANALYSIS ━━━
PostgreSQL storage:
  Total database: 65 MB
  Plays table: 45 MB
  Tracks table: 8 MB
  Artists table: 2 MB
  Albums table: 3 MB

Estimated savings:
  MongoDB equivalent: 370.37 MB
  PostgreSQL actual: 58.97 MB
  Savings: 311.4 MB (84.1%)
```

## 🔧 Advanced Usage

### Migrate Specific Collections Only

```bash
# Users only
npm run migrate:users-only

# Plays only (requires users to exist first)
npm run migrate:plays-only

# With custom batch size
node migrate.js --batch-size=5000
```

### Resume Failed Migration

The script handles duplicates gracefully. If migration fails partway:

```bash
# Just re-run the migration
npm run migrate
```

It will:
- Skip existing users (ON CONFLICT DO UPDATE)
- Skip duplicate plays (ON CONFLICT DO NOTHING)
- Continue where it left off

### Rollback / Reset

If you need to start over:

```sql
-- Connect to PostgreSQL
psql $DATABASE_URL

-- Drop all data (keeps schema)
TRUNCATE users, plays, artists, albums, tracks, import_jobs CASCADE;

-- Or drop entire schema and recreate
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
\i schema.sql
```

## 🔍 Troubleshooting

### Error: "Connection string is not configured"

```bash
# Make sure .env file exists and has DATABASE_URL
cat .env | grep DATABASE_URL

# If empty, add it
echo "DATABASE_URL=postgresql://..." >> .env
```

### Error: "relation 'users' does not exist"

Schema wasn't created. Run:
```bash
psql $DATABASE_URL -f schema.sql
```

### Error: "FATAL: password authentication failed"

Your connection string is wrong. Check:
- Username is correct
- Password is URL-encoded (spaces = %20, @ = %40)
- Host is correct
- Port is correct (usually 5432)

### Migration is Very Slow

```bash
# Increase batch size (uses more memory)
node migrate.js --batch-size=5000

# Or disable indexes temporarily (advanced)
psql $DATABASE_URL -c "DROP INDEX idx_plays_user_time;"
# ... run migration ...
psql $DATABASE_URL -c "CREATE INDEX idx_plays_user_time ON plays(user_id, played_at DESC);"
```

### Play Count Doesn't Match Exactly

This is normal! Reasons:
1. MongoDB may have had duplicates (same user+track+time)
2. PostgreSQL unique constraint prevents duplicates
3. Usually < 1% difference

If difference is > 5%, investigate:
```sql
-- Check for plays without users
SELECT COUNT(*) FROM plays p 
LEFT JOIN users u ON p.user_id = u.spotify_id 
WHERE u.spotify_id IS NULL;
```

## 📊 Understanding the New Schema

### Before (MongoDB - Denormalized)
```javascript
// plays collection - 300 bytes per document
{
  userId: "user123",
  trackId: "abc",
  trackName: "Bohemian Rhapsody",      // ❌ Repeated millions of times
  artistId: "xyz", 
  artistName: "Queen",                  // ❌ Repeated millions of times
  albumId: "album1",
  albumName: "A Night at the Opera",    // ❌ Repeated millions of times
  albumImage: "https://...",            // ❌ Repeated millions of times
  playedAt: "2025-11-06T10:00:00Z",
  durationMs: 354000,
  source: "tracked"
}
```

### After (PostgreSQL - Normalized)
```sql
-- plays table - 50 bytes per row
user_id | track_id | played_at           | source
--------|----------|---------------------|-------
user123 | abc      | 2025-11-06 10:00:00 | 0

-- tracks table (stored once)
id  | name                | artist_id | album_id | duration_ms
----|---------------------|-----------|----------|------------
abc | Bohemian Rhapsody   | xyz       | album1   | 354000

-- artists table (stored once)
id  | name
----|------
xyz | Queen

-- albums table (stored once)
id      | name                  | artist_id | image_url
--------|----------------------|-----------|----------
album1  | A Night at the Opera | xyz       | https://...
```

**Query Example:**
```sql
-- Get recent plays with all details (uses the plays_detailed view)
SELECT * FROM plays_detailed 
WHERE user_id = 'user123' 
ORDER BY played_at DESC 
LIMIT 10;

-- Returns: user_id, track_name, artist_name, album_name, etc.
-- PostgreSQL JOINs are VERY fast with proper indexes!
```

## 🔄 Next Steps After Migration

### 1. Update Your Application Code

You'll need to update your database queries. Here's a comparison:

**MongoDB (Before):**
```javascript
// Get recent plays
const plays = await Play.find({ userId })
  .sort({ playedAt: -1 })
  .limit(10);

// Already has trackName, artistName, albumName!
```

**PostgreSQL (After):**
```javascript
// Option A: Use the plays_detailed view (easiest)
const { rows } = await pool.query(`
  SELECT * FROM plays_detailed 
  WHERE user_id = $1 
  ORDER BY played_at DESC 
  LIMIT 10
`, [userId]);

// Option B: Manual JOIN
const { rows } = await pool.query(`
  SELECT 
    p.*,
    t.name as track_name,
    t.duration_ms,
    ar.name as artist_name,
    al.name as album_name,
    al.image_url as album_image
  FROM plays p
  LEFT JOIN tracks t ON p.track_id = t.id
  LEFT JOIN artists ar ON t.artist_id = ar.id
  LEFT JOIN albums al ON t.album_id = al.id
  WHERE p.user_id = $1
  ORDER BY p.played_at DESC
  LIMIT 10
`, [userId]);

// Option C: Use an ORM like Prisma
const plays = await prisma.play.findMany({
  where: { userId },
  include: {
    track: {
      include: {
        artist: true,
        album: true
      }
    }
  },
  orderBy: { playedAt: 'desc' },
  take: 10
});
```

### 2. Update Connection String

**In your Next.js app:**
```javascript
// Old (MongoDB)
import mongoose from 'mongoose';
await mongoose.connect(process.env.MONGODB_URI);

// New (PostgreSQL with pg)
import { Pool } from 'pg';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
});

// Or use Prisma
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
```

### 3. Run Performance Tests

```sql
-- Test query performance
EXPLAIN ANALYZE 
SELECT * FROM plays_detailed 
WHERE user_id = 'user123' 
ORDER BY played_at DESC 
LIMIT 10;

-- Should use index scan, not seq scan
-- Look for: "Index Scan using idx_plays_user_time"
```

### 4. Optimize PostgreSQL

```sql
-- Update statistics for query planner
VACUUM ANALYZE;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 5. Set Up Backups

**Supabase**: Automatic daily backups (paid plans)

**Manual backup:**
```bash
# Backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20251106.sql
```

### 6. Monitor Performance

```sql
-- Slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Index usage
SELECT * FROM pg_stat_user_indexes
WHERE idx_scan < 100;  -- Unused indexes
```

### 7. Consider Upgrading

Once verified, you can:
- ✅ Delete MongoDB cluster
- ✅ Cancel MongoDB Atlas subscription
- ✅ Celebrate your storage savings! 🎉

## 📋 Migration Checklist

- [ ] Choose PostgreSQL provider
- [ ] Create new PostgreSQL database
- [ ] Copy connection string
- [ ] Install dependencies (`npm install`)
- [ ] Configure `.env` file
- [ ] Create schema (`npm run setup:postgres`)
- [ ] Run dry run (`npm run migrate:dry-run`)
- [ ] Review dry run output
- [ ] Run full migration (`npm run migrate`)
- [ ] Verify migration (`npm run verify`)
- [ ] Update application code
- [ ] Test application thoroughly
- [ ] Set up backups
- [ ] Monitor performance
- [ ] Delete MongoDB cluster (when confident)

## 🆘 Getting Help

**Common issues:**
1. Connection errors → Check `.env` and connection strings
2. Schema errors → Re-run `schema.sql`
3. Slow migration → Increase `BATCH_SIZE`
4. Data mismatches → Check `verify.js` output

**Still stuck?**
- Check PostgreSQL logs in your provider's dashboard
- Review the error messages carefully
- Try migrating smaller batches (reduce BATCH_SIZE)
- Test with a subset of data first

## 📝 Notes

- ✅ Migration is **non-destructive** - MongoDB data remains untouched
- ✅ Safe to run multiple times - handles duplicates gracefully
- ✅ Can pause/resume - just re-run the script
- ✅ Includes progress bars for large datasets
- ✅ Automatically handles missing IDs in imported plays

## 🎉 Success!

Once migration is complete and verified, enjoy:
- 🔥 80% less storage usage
- ⚡ Fast queries with proper indexes
- 💰 Free tier that actually lasts
- 🏗️ Clean normalized schema
- 🔧 PostgreSQL's powerful features

Happy migrating! 🚀
