# Query Migration Guide: MongoDB → PostgreSQL

Quick reference for converting your existing MongoDB queries to PostgreSQL.

## 📖 Table of Contents
1. [Connection Setup](#connection-setup)
2. [Basic CRUD Operations](#basic-crud-operations)
3. [Common Queries](#common-queries)
4. [Aggregations & Analytics](#aggregations--analytics)
5. [Performance Tips](#performance-tips)

---

## Connection Setup

### MongoDB (Before)
```javascript
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
});

const User = mongoose.model('User', userSchema);
```

### PostgreSQL (After)
```javascript
// Option 1: Using pg
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
});

// Option 2: Using Prisma (recommended)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
```

---

## Basic CRUD Operations

### Create User

**MongoDB:**
```javascript
const user = await User.create({
  spotifyId: 'user123',
  displayName: 'John Doe',
  email: 'john@example.com',
  hasInitialImport: false,
  hasFullImport: false,
});
```

**PostgreSQL (pg):**
```javascript
const { rows } = await pool.query(`
  INSERT INTO users (spotify_id, display_name, email, import_flags)
  VALUES ($1, $2, $3, $4)
  RETURNING *
`, ['user123', 'John Doe', 'john@example.com', 0]);

const user = rows[0];
```

**PostgreSQL (Prisma):**
```javascript
const user = await prisma.user.create({
  data: {
    spotifyId: 'user123',
    displayName: 'John Doe',
    email: 'john@example.com',
    importFlags: 0,
  },
});
```

### Find User

**MongoDB:**
```javascript
const user = await User.findOne({ spotifyId: 'user123' });
```

**PostgreSQL (pg):**
```javascript
const { rows } = await pool.query(
  'SELECT * FROM users WHERE spotify_id = $1',
  ['user123']
);
const user = rows[0];
```

**PostgreSQL (Prisma):**
```javascript
const user = await prisma.user.findUnique({
  where: { spotifyId: 'user123' },
});
```

### Update User

**MongoDB:**
```javascript
await User.updateOne(
  { spotifyId: 'user123' },
  { 
    $set: { 
      spotifyAccessToken: 'newtoken',
      tokenExpiresAt: new Date(Date.now() + 3600000)
    }
  }
);
```

**PostgreSQL (pg):**
```javascript
await pool.query(`
  UPDATE users 
  SET access_token = $1, token_expires_at = $2, updated_at = NOW()
  WHERE spotify_id = $3
`, ['newtoken', new Date(Date.now() + 3600000), 'user123']);
```

**PostgreSQL (Prisma):**
```javascript
await prisma.user.update({
  where: { spotifyId: 'user123' },
  data: {
    accessToken: 'newtoken',
    tokenExpiresAt: new Date(Date.now() + 3600000),
  },
});
```

---

## Common Queries

### Track a Play

**MongoDB:**
```javascript
await Play.create({
  userId: 'user123',
  trackId: 'track456',
  trackName: 'Bohemian Rhapsody',
  artistId: 'artist789',
  artistName: 'Queen',
  albumId: 'album111',
  albumName: 'A Night at the Opera',
  playedAt: new Date(),
  durationMs: 354000,
  source: 'tracked',
});
```

**PostgreSQL (pg):**
```javascript
// First, ensure track/artist/album exist (upsert)
await pool.query(`
  INSERT INTO artists (id, name) 
  VALUES ($1, $2) 
  ON CONFLICT (id) DO NOTHING
`, ['artist789', 'Queen']);

await pool.query(`
  INSERT INTO albums (id, name, artist_id) 
  VALUES ($1, $2, $3) 
  ON CONFLICT (id) DO NOTHING
`, ['album111', 'A Night at the Opera', 'artist789']);

await pool.query(`
  INSERT INTO tracks (id, name, artist_id, album_id, duration_ms) 
  VALUES ($1, $2, $3, $4, $5) 
  ON CONFLICT (id) DO NOTHING
`, ['track456', 'Bohemian Rhapsody', 'artist789', 'album111', 354000]);

// Then insert play
await pool.query(`
  INSERT INTO plays (user_id, track_id, played_at, source)
  VALUES ($1, $2, $3, $4)
  ON CONFLICT (user_id, track_id, played_at) DO NOTHING
`, ['user123', 'track456', new Date(), 0]);
```

**PostgreSQL (Prisma):**
```javascript
// Prisma makes this much cleaner!
await prisma.artist.upsert({
  where: { id: 'artist789' },
  create: { id: 'artist789', name: 'Queen' },
  update: {},
});

await prisma.album.upsert({
  where: { id: 'album111' },
  create: { 
    id: 'album111', 
    name: 'A Night at the Opera', 
    artistId: 'artist789' 
  },
  update: {},
});

await prisma.track.upsert({
  where: { id: 'track456' },
  create: {
    id: 'track456',
    name: 'Bohemian Rhapsody',
    artistId: 'artist789',
    albumId: 'album111',
    durationMs: 354000,
  },
  update: {},
});

await prisma.play.create({
  data: {
    userId: 'user123',
    trackId: 'track456',
    playedAt: new Date(),
    source: 0,
  },
});
```

### Get Recent Plays

**MongoDB:**
```javascript
const plays = await Play.find({ userId: 'user123' })
  .sort({ playedAt: -1 })
  .limit(10);

// Already has trackName, artistName, etc.
```

**PostgreSQL (pg) - Using View:**
```javascript
const { rows } = await pool.query(`
  SELECT * FROM plays_detailed
  WHERE user_id = $1
  ORDER BY played_at DESC
  LIMIT 10
`, ['user123']);

// rows contain: track_name, artist_name, album_name, etc.
```

**PostgreSQL (Prisma):**
```javascript
const plays = await prisma.play.findMany({
  where: { userId: 'user123' },
  include: {
    track: {
      include: {
        artist: true,
        album: true,
      },
    },
  },
  orderBy: { playedAt: 'desc' },
  take: 10,
});

// Access: plays[0].track.name, plays[0].track.artist.name
```

### Get Plays by Date Range

**MongoDB:**
```javascript
const plays = await Play.find({
  userId: 'user123',
  playedAt: {
    $gte: startDate,
    $lte: endDate,
  },
});
```

**PostgreSQL (pg):**
```javascript
const { rows } = await pool.query(`
  SELECT * FROM plays_detailed
  WHERE user_id = $1 
    AND played_at >= $2 
    AND played_at <= $3
  ORDER BY played_at DESC
`, ['user123', startDate, endDate]);
```

**PostgreSQL (Prisma):**
```javascript
const plays = await prisma.play.findMany({
  where: {
    userId: 'user123',
    playedAt: {
      gte: startDate,
      lte: endDate,
    },
  },
  include: {
    track: {
      include: {
        artist: true,
        album: true,
      },
    },
  },
  orderBy: { playedAt: 'desc' },
});
```

---

## Aggregations & Analytics

### Total Play Count

**MongoDB:**
```javascript
const count = await Play.countDocuments({ userId: 'user123' });
```

**PostgreSQL (pg):**
```javascript
const { rows } = await pool.query(
  'SELECT COUNT(*) FROM plays WHERE user_id = $1',
  ['user123']
);
const count = parseInt(rows[0].count);
```

**PostgreSQL (Prisma):**
```javascript
const count = await prisma.play.count({
  where: { userId: 'user123' },
});
```

### Total Listening Time

**MongoDB:**
```javascript
const result = await Play.aggregate([
  { $match: { userId: 'user123' } },
  { $group: { _id: null, total: { $sum: '$durationMs' } } },
]);
const totalMs = result[0]?.total || 0;
```

**PostgreSQL (pg):**
```javascript
const { rows } = await pool.query(`
  SELECT COALESCE(SUM(t.duration_ms), 0) as total_ms
  FROM plays p
  JOIN tracks t ON p.track_id = t.id
  WHERE p.user_id = $1
`, ['user123']);
const totalMs = parseInt(rows[0].total_ms);
```

**PostgreSQL (Prisma):**
```javascript
const result = await prisma.play.aggregate({
  where: { userId: 'user123' },
  _sum: {
    track: {
      durationMs: true,
    },
  },
});
const totalMs = result._sum.track?.durationMs || 0;
```

### Top Artists

**MongoDB:**
```javascript
const topArtists = await Play.aggregate([
  { $match: { userId: 'user123' } },
  { 
    $group: { 
      _id: { artistId: '$artistId', artistName: '$artistName' },
      playCount: { $sum: 1 },
      totalDuration: { $sum: '$durationMs' },
    }
  },
  { $sort: { playCount: -1 } },
  { $limit: 10 },
  {
    $project: {
      _id: 0,
      artistId: '$_id.artistId',
      artistName: '$_id.artistName',
      playCount: 1,
      totalDuration: 1,
    }
  },
]);
```

**PostgreSQL (pg):**
```javascript
const { rows } = await pool.query(`
  SELECT 
    a.id as artist_id,
    a.name as artist_name,
    COUNT(p.id) as play_count,
    SUM(t.duration_ms) as total_duration
  FROM plays p
  JOIN tracks t ON p.track_id = t.id
  JOIN artists a ON t.artist_id = a.id
  WHERE p.user_id = $1
  GROUP BY a.id, a.name
  ORDER BY play_count DESC
  LIMIT 10
`, ['user123']);

// rows: [{ artist_id, artist_name, play_count, total_duration }, ...]
```

**PostgreSQL (Prisma):**
```javascript
// Use raw query for complex aggregations
const topArtists = await prisma.$queryRaw`
  SELECT 
    a.id as artist_id,
    a.name as artist_name,
    COUNT(p.id)::int as play_count,
    SUM(t.duration_ms)::bigint as total_duration
  FROM plays p
  JOIN tracks t ON p.track_id = t.id
  JOIN artists a ON t.artist_id = a.id
  WHERE p.user_id = ${userId}
  GROUP BY a.id, a.name
  ORDER BY play_count DESC
  LIMIT 10
`;
```

### Top Tracks

**MongoDB:**
```javascript
const topTracks = await Play.aggregate([
  { $match: { userId: 'user123' } },
  { 
    $group: { 
      _id: { trackId: '$trackId', trackName: '$trackName' },
      playCount: { $sum: 1 },
    }
  },
  { $sort: { playCount: -1 } },
  { $limit: 10 },
]);
```

**PostgreSQL (pg):**
```javascript
const { rows } = await pool.query(`
  SELECT 
    t.id as track_id,
    t.name as track_name,
    a.name as artist_name,
    COUNT(p.id) as play_count
  FROM plays p
  JOIN tracks t ON p.track_id = t.id
  JOIN artists a ON t.artist_id = a.id
  WHERE p.user_id = $1
  GROUP BY t.id, t.name, a.name
  ORDER BY play_count DESC
  LIMIT 10
`, ['user123']);
```

### Listening Timeline (Plays per Month)

**MongoDB:**
```javascript
const timeline = await Play.aggregate([
  { $match: { userId: 'user123' } },
  {
    $group: {
      _id: {
        year: { $year: '$playedAt' },
        month: { $month: '$playedAt' },
      },
      playCount: { $sum: 1 },
    }
  },
  { $sort: { '_id.year': 1, '_id.month': 1 } },
]);
```

**PostgreSQL (pg):**
```javascript
const { rows } = await pool.query(`
  SELECT 
    EXTRACT(YEAR FROM played_at)::int as year,
    EXTRACT(MONTH FROM played_at)::int as month,
    COUNT(*) as play_count
  FROM plays
  WHERE user_id = $1
  GROUP BY year, month
  ORDER BY year, month
`, ['user123']);
```

### Listening by Day of Week

**MongoDB:**
```javascript
const byDay = await Play.aggregate([
  { $match: { userId: 'user123' } },
  {
    $group: {
      _id: { $dayOfWeek: '$playedAt' },
      playCount: { $sum: 1 },
    }
  },
  { $sort: { _id: 1 } },
]);
```

**PostgreSQL (pg):**
```javascript
const { rows } = await pool.query(`
  SELECT 
    EXTRACT(DOW FROM played_at)::int as day_of_week,
    TO_CHAR(played_at, 'Day') as day_name,
    COUNT(*) as play_count
  FROM plays
  WHERE user_id = $1
  GROUP BY day_of_week, day_name
  ORDER BY day_of_week
`, ['user123']);
```

---

## Performance Tips

### 1. Use Prepared Statements

**Good:**
```javascript
// Parameters prevent SQL injection AND improve performance
await pool.query('SELECT * FROM users WHERE spotify_id = $1', [userId]);
```

**Bad:**
```javascript
// Never concatenate user input!
await pool.query(`SELECT * FROM users WHERE spotify_id = '${userId}'`);
```

### 2. Use Transactions for Multiple Inserts

**MongoDB:**
```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  await User.create([userData], { session });
  await Play.create([playData], { session });
  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction();
}
```

**PostgreSQL (pg):**
```javascript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO users ...', []);
  await client.query('INSERT INTO plays ...', []);
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
}
```

**PostgreSQL (Prisma):**
```javascript
await prisma.$transaction([
  prisma.user.create({ data: userData }),
  prisma.play.create({ data: playData }),
]);
```

### 3. Batch Inserts

**MongoDB:**
```javascript
await Play.insertMany(playsArray, { ordered: false });
```

**PostgreSQL (pg):**
```javascript
// Build VALUES list
const values = playsArray.map((p, i) => {
  const offset = i * 4;
  return `($${offset+1}, $${offset+2}, $${offset+3}, $${offset+4})`;
}).join(',');

const params = playsArray.flatMap(p => 
  [p.userId, p.trackId, p.playedAt, p.source]
);

await pool.query(`
  INSERT INTO plays (user_id, track_id, played_at, source) 
  VALUES ${values}
  ON CONFLICT DO NOTHING
`, params);
```

**PostgreSQL (Prisma):**
```javascript
await prisma.play.createMany({
  data: playsArray,
  skipDuplicates: true,
});
```

### 4. Use Indexes Effectively

```sql
-- Check if query uses indexes
EXPLAIN ANALYZE 
SELECT * FROM plays 
WHERE user_id = 'user123' 
ORDER BY played_at DESC 
LIMIT 10;

-- Should show: "Index Scan using idx_plays_user_time"
-- NOT: "Seq Scan on plays"
```

### 5. Connection Pooling

**MongoDB:**
```javascript
mongoose.connect(uri, { maxPoolSize: 10 });
```

**PostgreSQL (pg):**
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,  // max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## Migration Checklist

- [ ] Replace mongoose with pg or Prisma
- [ ] Update all `.find()` → `SELECT`
- [ ] Update all `.create()` → `INSERT`
- [ ] Update all `.updateOne()` → `UPDATE`
- [ ] Convert aggregations to SQL or raw queries
- [ ] Handle normalized data (JOINs or use views)
- [ ] Test all queries thoroughly
- [ ] Check query performance with EXPLAIN ANALYZE
- [ ] Update error handling (different error formats)
- [ ] Update connection management

---

## Quick Reference

| Operation | MongoDB | PostgreSQL |
|-----------|---------|------------|
| Find one | `findOne()` | `SELECT ... LIMIT 1` |
| Find many | `find()` | `SELECT ...` |
| Insert | `create()` | `INSERT INTO ...` |
| Update | `updateOne()` | `UPDATE ... WHERE` |
| Delete | `deleteOne()` | `DELETE FROM ... WHERE` |
| Count | `countDocuments()` | `SELECT COUNT(*)` |
| Aggregate | `aggregate()` | `GROUP BY` + `JOIN` |
| Sort | `.sort()` | `ORDER BY` |
| Limit | `.limit()` | `LIMIT` |
| Skip | `.skip()` | `OFFSET` |

Happy querying! 🚀
