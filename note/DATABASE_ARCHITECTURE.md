# Database Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         YOUR NEXT.JS APP                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐         ┌──────────────┐                      │
│  │   Frontend   │         │  API Routes  │                      │
│  │  Components  │────────▶│  (Next.js)   │                      │
│  └──────────────┘         └──────┬───────┘                      │
│                                   │                              │
│                                   ▼                              │
│                          ┌─────────────────┐                    │
│                          │  Database Layer │                    │
│                          │  (src/lib/db)   │                    │
│                          └────────┬────────┘                    │
└───────────────────────────────────┼─────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │      MongoDB Atlas Cloud      │
                    │                               │
                    │  ┌─────────┐  ┌──────────┐   │
                    │  │  users  │  │  plays   │   │
                    │  └─────────┘  └──────────┘   │
                    │  ┌───────────────┐           │
                    │  │ import_jobs   │           │
                    │  └───────────────┘           │
                    └───────────────────────────────┘
                                    ▲
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
              ┌─────▼─────┐   ┌────▼────┐   ┌─────▼─────┐
              │    Dev     │   │  Prod   │   │   Test    │
              │  Database  │   │Database │   │ Database  │
              └────────────┘   └─────────┘   └───────────┘
```

## Data Flow: User Login

```
1. User clicks "Login with Spotify"
   │
   ▼
2. Redirected to Spotify OAuth
   │
   ▼
3. User grants permissions
   │
   ▼
4. Spotify redirects back with code
   │
   ▼
5. Exchange code for tokens
   │
   ▼
6. Fetch user profile from Spotify
   │
   ▼
7. saveUser() ─────────────────────────────────────┐
   │                                                │
   ▼                                                ▼
   MongoDB: users collection              Store access token
   {                                      Store refresh token
     spotifyId: "user123",                Calculate expiration
     displayName: "John",
     email: "john@example.com",
     spotifyAccessToken: "BQD...",
     spotifyRefreshToken: "AQD...",
     tokenExpiresAt: Date,
     joinedAt: Date,
     hasInitialImport: false
   }
```

## Data Flow: Tracking Plays

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONTINUOUS POLLING CYCLE                      │
│                    (Every 30 seconds)                            │
└─────────────────────────────────────────────────────────────────┘

1. Get user from database
   getUserBySpotifyId(userId)
   │
   ▼
2. Check if token expired
   user.needsTokenRefresh()
   │
   ├─ YES ──▶ Refresh token automatically
   │          refreshSpotifyToken()
   │
   ▼
3. Fetch recently played from Spotify API
   GET https://api.spotify.com/v1/me/player/recently-played?limit=50
   │
   ▼
4. Format plays for database
   [{
     userId: "user123",
     trackId: "spotify:track:abc123",
     trackName: "Bohemian Rhapsody",
     artistId: "spotify:artist:queen",
     artistName: "Queen",
     albumId: "spotify:album:night",
     albumName: "A Night at the Opera",
     playedAt: "2024-01-15T14:30:00Z",
     durationMs: 354000,
     source: "tracked"
   }, ...]
   │
   ▼
5. Bulk insert to database
   trackMultiplePlays(plays)
   │
   ├─ Duplicate? ──▶ Skip (unique index prevents duplicates)
   │
   ├─ New play? ───▶ Insert into MongoDB
   │
   ▼
6. Update last check timestamp
   updateLastCheckTimestamp(userId)
   │
   ▼
7. Wait 30 seconds, repeat from step 1
```

## Data Flow: Getting Statistics

```
User requests stats dashboard
   │
   ▼
GET /api/stats/dashboard?userId=user123
   │
   ▼
getStatsByPeriod(userId, 'month')
   │
   ├─────────────────────┬─────────────────────┬─────────────────────┐
   │                     │                     │                     │
   ▼                     ▼                     ▼                     ▼
getTopTracks()    getTopArtists()      getTopAlbums()     getTotalPlays()
   │                     │                     │                     │
   ▼                     ▼                     ▼                     ▼
MongoDB               MongoDB               MongoDB               MongoDB
Aggregation          Aggregation           Aggregation           Count Query
   │                     │                     │                     │
   └─────────────────────┴─────────────────────┴─────────────────────┘
                                    │
                                    ▼
                          Combine all results
                                    │
                                    ▼
                          Return JSON to frontend
                                    │
                                    ▼
                          React component renders
```

## Database Query Optimization

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLAYS COLLECTION INDEXES                      │
│                  (Critical for Performance)                      │
└─────────────────────────────────────────────────────────────────┘

Query: Get user's top tracks in last month
────────────────────────────────────────────────────────────────

WITHOUT INDEX:
  plays.find({ userId: "user123", playedAt: { $gte: lastMonth } })
  ❌ Full collection scan: 10,000,000 documents
  ⏱️  Time: 30+ seconds

WITH COMPOUND INDEX { userId: 1, playedAt: -1 }:
  MongoDB uses index to quickly find relevant documents
  ✅ Index scan: Only user's documents (~50,000)
  ⏱️  Time: < 100ms

RESULT:
  300x faster queries!
```

## Collections Relationship Diagram

```
┌───────────────────────────────────────────────────────────────┐
│                        users                                   │
├───────────────────────────────────────────────────────────────┤
│ spotifyId (PRIMARY KEY)                                        │
│ displayName                                                    │
│ email                                                          │
│ spotifyAccessToken                                             │
│ spotifyRefreshToken                                            │
│ tokenExpiresAt                                                 │
│ hasInitialImport                                               │
│ hasFullImport                                                  │
└─────────────────────┬─────────────────────────────────────────┘
                      │
                      │ ONE user
                      │
          ┌───────────┼───────────┐
          │           │           │
          │ has MANY  │ has MANY  │ has MANY
          │           │           │
          ▼           ▼           ▼
    ┌─────────┐ ┌───────────┐ ┌──────────────┐
    │  plays  │ │  plays    │ │ import_jobs  │
    ├─────────┤ ├───────────┤ ├──────────────┤
    │ userId ─┼─│ userId ───┼─│ userId       │
    │ trackId │ │ artistId  │ │ status       │
    │playedAt │ │ albumId   │ │ totalTracks  │
    └─────────┘ └───────────┘ └──────────────┘
        │             │              │
        │ Millions    │ Millions     │ Few
        │ of docs     │ of docs      │ docs
```

## Token Refresh Flow

```
┌─────────────────────────────────────────────────────────────┐
│              AUTOMATIC TOKEN REFRESH FLOW                    │
└─────────────────────────────────────────────────────────────┘

User makes API request
   │
   ▼
getValidAccessToken(user)
   │
   ▼
Check: Is token expired?
   │
   ├─ NO ──▶ Return current access token
   │
   ▼ YES
   │
refreshSpotifyToken(refreshToken)
   │
   ├─ POST to Spotify: /api/token
   │  Body: { grant_type: "refresh_token", refresh_token: "..." }
   │  Auth: Basic base64(client_id:client_secret)
   │
   ▼
Spotify returns new tokens
   {
     access_token: "BQD...",
     refresh_token: "AQD..." (may be same),
     expires_in: 3600
   }
   │
   ▼
Update database
   updateUserTokens(spotifyId, {
     accessToken: newToken,
     refreshToken: newRefreshToken,
     expiresAt: Date.now() + 3600000
   })
   │
   ▼
Return new access token
   │
   ▼
Make Spotify API request with fresh token
```

## Import Full History Flow

```
┌─────────────────────────────────────────────────────────────┐
│           FULL SPOTIFY HISTORY IMPORT FLOW                   │
│          (From Spotify Data Export ZIP)                      │
└─────────────────────────────────────────────────────────────┘

1. User uploads ZIP file
   │
   ▼
2. Create import job
   ImportJob.createJob(userId, fileName, totalTracks)
   │
   ▼
   MongoDB: import_jobs
   {
     userId: "user123",
     status: "pending",
     fileName: "my_spotify_data.zip",
     totalTracks: 50000,
     processedTracks: 0
   }
   │
   ▼
3. Start processing
   job.start()
   status = "processing"
   │
   ▼
4. Process in batches of 1000
   │
   ├─ Batch 1: Parse 1000 tracks from ZIP
   │  │
   │  ├─ Format for database
   │  │
   │  ├─ trackMultiplePlays(batch)
   │  │
   │  ├─ MongoDB: Bulk insert (skip duplicates)
   │  │
   │  └─ job.updateProgress(1000)
   │
   ├─ Batch 2: Parse next 1000 tracks...
   │  └─ [Repeat]
   │
   └─ Batch N: Last batch
      │
      ▼
5. Mark complete
   job.complete()
   markFullImportComplete(userId)
   │
   ▼
   MongoDB: import_jobs
   {
     status: "completed",
     processedTracks: 50000,
     completedAt: Date
   }
   │
   MongoDB: users
   {
     hasFullImport: true
   }
```

## Stats Query Performance

```
┌─────────────────────────────────────────────────────────────┐
│              AGGREGATION PIPELINE EXAMPLE                    │
│              (Get Top Tracks)                                │
└─────────────────────────────────────────────────────────────┘

getTopTracks(userId, { startDate, endDate, limit: 50 })
   │
   ▼
MongoDB Aggregation Pipeline:
   │
   ├─ Stage 1: $match
   │  Filter by userId and date range
   │  Uses INDEX: { userId: 1, playedAt: -1 }
   │  Input:  10,000,000 docs
   │  Output: 50,000 docs (one user's plays)
   │
   ├─ Stage 2: $group
   │  Group by trackId
   │  Count plays per track
   │  Calculate total duration
   │  Find first/last play date
   │  Input:  50,000 docs
   │  Output: 5,000 unique tracks
   │
   ├─ Stage 3: $sort
   │  Sort by playCount descending
   │  Input:  5,000 tracks
   │  Output: 5,000 tracks (sorted)
   │
   └─ Stage 4: $limit
      Return top 50
      Input:  5,000 tracks
      Output: 50 tracks
      │
      ▼
   RESULT: Top 50 tracks in < 100ms
```

## Environment Setup

```
┌─────────────────────────────────────────────────────────────┐
│                   ENVIRONMENT SEPARATION                     │
└─────────────────────────────────────────────────────────────┘

LOCAL DEVELOPMENT                        PRODUCTION (Vercel)
┌──────────────────┐                    ┌──────────────────┐
│   .env.local     │                    │ Environment Vars │
├──────────────────┤                    ├──────────────────┤
│ NODE_ENV=dev     │                    │ NODE_ENV=prod    │
│ MONGODB_URI=...  │                    │ MONGODB_URI=...  │
│ MONGODB_DB_NAME  │                    │ MONGODB_DB_NAME  │
│ =SpotifyLocal_Dev│                    │ =SpotifyLocal_Prod
└────────┬─────────┘                    └────────┬─────────┘
         │                                       │
         ▼                                       ▼
┌────────────────────┐              ┌────────────────────┐
│  Dev Database      │              │  Prod Database     │
│  SpotifyLocal_Dev  │              │  SpotifyLocal_Prod │
│                    │              │                    │
│  • Test freely     │              │  • Real users      │
│  • Break things    │              │  • Protected       │
│  • Experiment      │              │  • Backups         │
└────────────────────┘              └────────────────────┘
```

## Scaling Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    SCALING TIMELINE                          │
└─────────────────────────────────────────────────────────────┘

STAGE 1: MVP (Free Tier - 512 MB)
├─ 30-40 users with full history
├─ Basic indexes
├─ Direct queries
└─ < 100ms response time

STAGE 2: Growing (Paid Tier - 10 GB) - $10/month
├─ 200-300 users
├─ Additional indexes
├─ Query optimization
└─ Cache common queries (Redis)

STAGE 3: Scale Up (Dedicated Cluster) - $60+/month
├─ 1000+ users
├─ Pre-computed stats
├─ Background aggregation jobs
├─ CDN for static data
└─ Load balancing

STAGE 4: Enterprise (Sharded Cluster) - Custom pricing
├─ Millions of users
├─ Horizontal sharding by userId
├─ Read replicas
├─ Multi-region deployment
└─ Real-time analytics
```

---

This architecture provides:
✅ **Scalability** - Handles millions of plays efficiently
✅ **Performance** - < 100ms queries with proper indexes
✅ **Reliability** - Duplicate prevention, token refresh
✅ **Flexibility** - Easy to add new features
✅ **Maintainability** - Clean separation of concerns
