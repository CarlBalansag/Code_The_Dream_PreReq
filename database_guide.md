# Spotify App Database & Data Reference Guide

> **Purpose:** This guide documents the database structure, available data, and common usage patterns for building new features in this Spotify analytics app.

---

## 📊 DATABASE OVERVIEW

This app uses **MongoDB** with **3 main collections**:

### 1. PLAYS Collection (Primary Data Source)

Stores every single song play - this is the primary data source for all analytics.

#### Available Fields

| Field | Type | Description |
|-------|------|-------------|
| `userId` | String | User's Spotify ID (links to User collection) |
| `trackId` | String | Spotify track ID |
| `trackName` | String | Song name |
| `artistId` | String | Spotify artist ID |
| `artistName` | String | Artist name |
| `albumId` | String | Spotify album ID |
| `albumName` | String | Album name |
| `albumImage` | String | Album cover image URL |
| `playedAt` | Date | Date/time when the song was played |
| `durationMs` | Number | Song duration in milliseconds |
| `source` | String | Where this play came from: `"tracked"`, `"initial_import"`, or `"full_import"` |

#### Built-in Query Methods

Located in: `src/lib/models/Play.js`

```javascript
// Get total play count
Play.getTotalPlays(userId)

// Get total listening time in milliseconds
Play.getTotalListeningTime(userId)

// Get top tracks with play counts
Play.getTopTracks(userId, {
  startDate: Date,  // Optional
  endDate: Date,    // Optional
  limit: 50         // Optional (default: 50)
})
// Returns: trackId, trackName, artistName, albumName, albumImage, playCount, totalDurationMs, firstPlayed, lastPlayed

// Get top artists with play counts
Play.getTopArtists(userId, {
  startDate: Date,  // Optional
  endDate: Date,    // Optional
  limit: 50         // Optional (default: 50)
})
// Returns: artistId, artistName, playCount, totalDurationMs, firstPlayed, lastPlayed, uniqueTrackCount

// Get top albums with play counts
Play.getTopAlbums(userId, {
  startDate: Date,  // Optional
  endDate: Date,    // Optional
  limit: 50         // Optional (default: 50)
})
// Returns: albumId, albumName, artistName, albumImage, playCount, totalDurationMs, firstPlayed, lastPlayed, uniqueTrackCount

// Get recent plays for a user
Play.getRecentPlays(userId, limit = 50)

// Get listening history timeline (plays grouped by month)
Play.getListeningTimeline(userId)
// Returns: year, month, playCount, totalDurationMs

// Check if a play already exists (prevent duplicates)
Play.playExists(userId, trackId, playedAt)

// Bulk insert plays (for importing history)
Play.bulkInsertPlays(plays)
```

#### Critical Indexes

```javascript
// Compound indexes for performance
{ userId: 1, playedAt: -1 }
{ userId: 1, trackId: 1 }
{ userId: 1, artistId: 1 }
{ userId: 1, albumId: 1 }

// Unique index to prevent duplicates
{ userId: 1, trackId: 1, playedAt: 1 }
```

---

### 2. USERS Collection

Stores user accounts and Spotify authentication tokens.

#### Available Fields

| Field | Type | Description |
|-------|------|-------------|
| `spotifyId` | String | Spotify's unique user ID (PRIMARY KEY) |
| `displayName` | String | User's display name |
| `email` | String | User's email (optional) |
| `country` | String | User's country |
| `profileImage` | String | Profile picture URL |
| `spotifyAccessToken` | String | Spotify API access token |
| `spotifyRefreshToken` | String | Spotify API refresh token |
| `tokenExpiresAt` | Date | When the token expires |
| `hasInitialImport` | Boolean | Whether user has done initial 50-song import |
| `hasFullImport` | Boolean | Whether user has imported full history from ZIP |
| `lastCheckTimestamp` | Date | Last time we polled Spotify for new plays |
| `joinedAt` | Date | Account creation date |
| `createdAt` | Date | Auto-generated timestamp |
| `updatedAt` | Date | Auto-generated timestamp |

#### Built-in Methods

Located in: `src/lib/models/User.js`

```javascript
// Static methods
User.findBySpotifyId(spotifyId)
User.findByEmail(email)

// Instance methods
user.isTokenExpired()      // Returns true if token is expired
user.needsTokenRefresh()   // Returns true if token expires in < 5 minutes
```

---

### 3. IMPORT_JOBS Collection

Tracks progress when users import their full Spotify history from ZIP files.

#### Available Fields

| Field | Type | Description |
|-------|------|-------------|
| `userId` | String | User's Spotify ID |
| `status` | String | `"pending"`, `"processing"`, `"completed"`, or `"failed"` |
| `fileName` | String | Name of the imported file |
| `totalTracks` | Number | Total tracks to process |
| `processedTracks` | Number | Tracks processed so far |
| `startedAt` | Date | When job started |
| `completedAt` | Date | When job completed |
| `errorMessage` | String | Error message if failed |
| `createdAt` | Date | Auto-generated timestamp |
| `updatedAt` | Date | Auto-generated timestamp |

#### Built-in Methods

Located in: `src/lib/models/ImportJob.js`

```javascript
// Instance methods
job.start()                        // Mark job as started
job.updateProgress(processedTracks) // Update progress
job.complete()                     // Mark job as completed
job.fail(errorMessage)             // Mark job as failed
job.getProgress()                  // Get progress percentage

// Static methods
ImportJob.getActiveJob(userId)           // Get active import job for user
ImportJob.getUserJobs(userId, limit = 10) // Get all jobs for user
ImportJob.getJobById(jobId)              // Get job by ID
ImportJob.createJob(userId, fileName, totalTracks) // Create new import job
ImportJob.cleanupOldJobs(userId)         // Clean up old completed jobs (keep only last 5)
```

---

## 🔌 AVAILABLE API ENDPOINTS

### Stats Endpoints

#### `GET /api/stats/artist-history/[artistId]`

Returns listening history chart data for a specific artist.

**Query Parameters:**
- `userId` (required) - User's Spotify ID
- `timeRange` - One of: `7D`, `30D`, `ALL` (default: `30D`)

**Response:**
```json
{
  "artistId": "string",
  "artistName": "string",
  "timeRange": "30D",
  "startDate": "ISO date string",
  "endDate": "ISO date string",
  "chartData": [
    {
      "date": "Jan 1",
      "fullDate": "January 1, 2025",
      "totalSongs": 45,
      "artistSongs": 20,
      "percentage": 44
    }
  ],
  "totalDays": 30,
  "totalPlays": 150
}
```

### Polling Endpoints

#### `POST /api/poll/plays`

Poll Spotify for new plays for a specific user.

**Request Body:**
```json
{
  "spotifyId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "newPlaysCount": 5,
  "message": "Polled successfully"
}
```

#### `GET /api/poll/plays?spotifyId=xxx`

Quick check for new plays (returns count only).

### Import Endpoints

#### `POST /api/import/initial`

Import initial 50 songs from Spotify.

#### `POST /api/import/spotify-history`

Import full listening history from ZIP file.

#### `GET /api/import/status/[jobId]`

Check import job status.

### Debug Endpoints

#### `GET /api/debug/plays`

Debug endpoint to check plays data.

---

## 💡 HOW TO USE THIS DATA IN FUTURE PROMPTS

When asking Claude to build new features, reference this structure using these templates:

### For Analytics/Stats Features

```
"I want to add a feature that shows [WHAT YOU WANT].
Use the PLAYS collection which has these fields:
userId, trackId, trackName, artistId, artistName, albumId,
albumName, playedAt, durationMs.

I want to show [SPECIFIC METRIC] by [TIME RANGE/GROUPING]."
```

**Example:**
> "I want to show my top 10 most played songs this month. Use the PLAYS collection and filter by playedAt for the last 30 days, then group by trackId and count plays."

### For Chart/Visualization Features

```
"Create a chart showing [METRIC] over time.
Use the Play model's aggregate functions to group by [DAY/WEEK/MONTH].
The chart should display [WHAT DATA] and support filtering by [TIME RANGES]."
```

**Example:**
> "Create a chart showing total listening time per day for the last 3 months. Use Play.aggregate() to group by day and sum durationMs. The chart should show a line graph with date on X-axis and hours on Y-axis."

### For Top Lists/Rankings

```
"Build a top [TRACKS/ARTISTS/ALBUMS] list.
Use the Play.getTop[Tracks/Artists/Albums] method which supports:
- startDate/endDate filtering
- limit parameter for number of results
It returns: playCount, totalDurationMs, firstPlayed, lastPlayed, uniqueTrackCount"
```

**Example:**
> "Build a top 20 artists list for all time. Use Play.getTopArtists() with no date filtering and limit=20. Display artistName, playCount, and total listening hours."

### For Artist-Specific Features

```
"I want to show detailed stats for a specific artist.
Query the PLAYS collection filtered by artistId and userId.
Available artist data: artistId, artistName (can get albumId, trackId for that artist)"
```

**Example:**
> "Show me all albums by Drake that I've listened to, sorted by play count. Filter PLAYS by artistName='Drake', group by albumId, and count plays per album."

### For Time-Based Analysis

```
"Show my listening patterns by [HOUR/DAY/MONTH/YEAR].
Use playedAt field from PLAYS collection.
Group by [TIME UNIT] and calculate [METRIC]."
```

**Example:**
> "Show my listening patterns by hour of day. Extract hour from playedAt, group by hour (0-23), and count total plays for each hour."

---

## 📈 COMMON DATA PATTERNS

### Play Count by Artist

```javascript
const topArtists = await Play.aggregate([
  { $match: { userId, playedAt: { $gte: startDate } } },
  {
    $group: {
      _id: "$artistId",
      name: { $first: "$artistName" },
      count: { $sum: 1 },
      totalDuration: { $sum: "$durationMs" }
    }
  },
  { $sort: { count: -1 } },
  { $limit: 50 }
]);
```

### Listening Time by Day

```javascript
const dailyListening = await Play.aggregate([
  { $match: { userId } },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$playedAt" } },
      totalMs: { $sum: "$durationMs" },
      playCount: { $sum: 1 }
    }
  },
  { $sort: { "_id": 1 } }
]);
```

### Artist Diversity (Unique Artists)

```javascript
const uniqueArtists = await Play.distinct("artistId", { userId });
const artistCount = uniqueArtists.length;
```

### Top Tracks in Date Range

```javascript
const topTracks = await Play.aggregate([
  {
    $match: {
      userId,
      playedAt: {
        $gte: new Date('2025-01-01'),
        $lte: new Date('2025-01-31')
      }
    }
  },
  {
    $group: {
      _id: "$trackId",
      trackName: { $first: "$trackName" },
      artistName: { $first: "$artistName" },
      albumImage: { $first: "$albumImage" },
      playCount: { $sum: 1 }
    }
  },
  { $sort: { playCount: -1 } },
  { $limit: 10 }
]);
```

### Listening by Hour of Day

```javascript
const listeningByHour = await Play.aggregate([
  { $match: { userId } },
  {
    $group: {
      _id: { $hour: "$playedAt" },
      count: { $sum: 1 }
    }
  },
  { $sort: { "_id": 1 } }
]);
```

### Most Played Album

```javascript
const topAlbums = await Play.aggregate([
  { $match: { userId } },
  {
    $group: {
      _id: "$albumId",
      albumName: { $first: "$albumName" },
      artistName: { $first: "$artistName" },
      albumImage: { $first: "$albumImage" },
      playCount: { $sum: 1 },
      uniqueTracks: { $addToSet: "$trackId" }
    }
  },
  {
    $project: {
      albumName: 1,
      artistName: 1,
      albumImage: 1,
      playCount: 1,
      trackCount: { $size: "$uniqueTracks" }
    }
  },
  { $sort: { playCount: -1 } },
  { $limit: 20 }
]);
```

### Monthly Listening Trends

```javascript
const monthlyTrends = await Play.aggregate([
  { $match: { userId } },
  {
    $group: {
      _id: {
        year: { $year: "$playedAt" },
        month: { $month: "$playedAt" }
      },
      playCount: { $sum: 1 },
      totalDurationMs: { $sum: "$durationMs" },
      uniqueArtists: { $addToSet: "$artistId" },
      uniqueTracks: { $addToSet: "$trackId" }
    }
  },
  {
    $project: {
      year: "$_id.year",
      month: "$_id.month",
      playCount: 1,
      totalDurationMs: 1,
      uniqueArtistCount: { $size: "$uniqueArtists" },
      uniqueTrackCount: { $size: "$uniqueTracks" }
    }
  },
  { $sort: { "year": 1, "month": 1 } }
]);
```

### Average Plays Per Day

```javascript
const stats = await Play.aggregate([
  { $match: { userId } },
  {
    $group: {
      _id: null,
      totalPlays: { $sum: 1 },
      earliestPlay: { $min: "$playedAt" },
      latestPlay: { $max: "$playedAt" }
    }
  }
]);

const daysDiff = Math.ceil((stats[0].latestPlay - stats[0].earliestPlay) / (1000 * 60 * 60 * 24));
const avgPerDay = stats[0].totalPlays / daysDiff;
```

---

## 🎯 KEY INSIGHTS YOU CAN BUILD

With this data structure, you can create:

### 📊 Statistics & Analytics
- ✅ Top tracks/artists/albums by any time range
- ✅ Total listening time analytics
- ✅ Play count trends over time
- ✅ Average plays per day/week/month
- ✅ Peak listening times/days
- ✅ Listening streaks (consecutive days)
- ✅ Monthly/yearly listening reports

### 📈 Charts & Visualizations
- ✅ Listening history charts and timelines
- ✅ Daily/weekly/monthly listening patterns
- ✅ Artist-specific listening patterns
- ✅ Genre distribution over time
- ✅ Listening heatmaps (hour of day × day of week)

### 🎵 Discovery & Diversity
- ✅ Discovery metrics (new artists/tracks per month)
- ✅ Artist diversity score
- ✅ Music taste evolution over time
- ✅ One-hit wonders (artists with only 1 track played)
- ✅ Deep cuts vs. popular tracks

### 🏆 Rankings & Comparisons
- ✅ All-time top tracks/artists/albums
- ✅ Most improved artists (month over month)
- ✅ Forgotten favorites (previously top artists not played recently)
- ✅ Album completion tracking
- ✅ Artist loyalty score

### 🎧 Listening Behavior
- ✅ Binge listening detection (same artist/track repeatedly)
- ✅ Skip patterns (short play durations)
- ✅ Listening session analysis
- ✅ Mood tracking (tempo/energy patterns)
- ✅ Seasonal listening trends

### 🔮 Recommendations & Predictions
- ✅ Playlist generation based on play history
- ✅ Similar artist recommendations
- ✅ Predicted next favorite artists
- ✅ Forgotten gems recommendations

---

## 🔑 KEY REMINDERS

When working with this data, remember:

1. **All plays are linked to `userId`** - Always filter by userId to get user-specific data
2. **`playedAt` is a Date object** - Perfect for time-based queries and sorting
3. **Use MongoDB aggregation for complex analytics** - More efficient than multiple queries
4. **The Play model has pre-built methods** - Use them when possible to avoid duplicating logic
5. **Time ranges are now**: `7D`, `30D`, `ALL` - ALL is dynamically calculated from earliest play
6. **Indexes are optimized** - Queries on userId + playedAt will be fast
7. **Prevent duplicates** - Use the unique index on userId + trackId + playedAt
8. **Duration is in milliseconds** - Convert to minutes/hours for display: `ms / (1000 * 60)` for minutes

---

## 📝 FILE LOCATIONS

- **Models**: `src/lib/models/`
  - `Play.js` - Play schema and methods
  - `User.js` - User schema and methods
  - `ImportJob.js` - ImportJob schema and methods

- **API Routes**: `src/app/api/`
  - `stats/artist-history/[artistId]/route.js` - Artist history endpoint
  - `poll/plays/route.js` - Polling endpoint
  - `import/initial/route.js` - Initial import endpoint
  - `import/spotify-history/route.js` - Full import endpoint
  - `import/status/[jobId]/route.js` - Import status endpoint
  - `debug/plays/route.js` - Debug endpoint

- **Database Connection**: `src/lib/mongodb.js`

---

**Last Updated:** January 2025

**Database:** MongoDB
**ODM:** Mongoose
**Time Zones:** All dates use local timezone for day grouping
