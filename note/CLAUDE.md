# Spotify Local - Project Documentation

## Project Overview

A Next.js 15 application that integrates with Spotify Web API to display currently playing music, user statistics, listening history, and playback controls. Features database-backed play tracking for comprehensive listening analytics beyond Spotify's API limitations.

**Current Status:** Spotify development mode (limited to 20 authorized users)

---

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Test database connection
node test-prisma-connection.mjs
```

Development server: `http://127.0.0.1:3000`

---

## Tech Stack

### Core Framework
- **Next.js 15.3.1** - App Router with React Server Components
- **React 19** - UI library
- **Tailwind CSS 4** - Styling

### Database & ORM
- **Prisma 6.19.0** - Database ORM
- **PostgreSQL** - Primary database (Supabase hosted at `aws-1-us-east-2.pooler.supabase.com`)
- **MongoDB** - Secondary database (connection pool managed)

### UI Libraries
- **Framer Motion** - Animations (modals, transitions, layout animations)
- **Swiper.js** - Mobile carousels
- **Ark UI React** - Component primitives
- **Lucide React** - Icon library
- **Recharts** - Chart visualizations (area charts for play history)
- **Chart.js** - Planned for radar charts

### APIs
- **Spotify Web API** - Music data and playback control
- **Custom REST APIs** - Database queries and analytics

---

## Architecture

### Database Schema

**Primary Database (PostgreSQL via Prisma):**

```prisma
// User model
model users {
  id                String   @id @default(uuid())
  spotify_id        String   @unique
  display_name      String?
  email             String?
  profile_image_url String?
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
}

// Tracks with artist relationship
model tracks {
  id          String   @id @default(uuid())
  spotify_id  String?  @unique
  name        String
  artist_id   String?
  artist_name String?
  album_name  String?
  duration_ms Int?
  created_at  DateTime @default(now())
}

// Artists
model artists {
  id         String   @id @default(uuid())
  spotify_id String?  @unique
  name       String   @unique
  created_at DateTime @default(now())
}

// Play history with duplicate prevention
model plays {
  id        String   @id @default(uuid())
  user_id   String
  track_id  String
  played_at DateTime
  created_at DateTime @default(now())

  // Prevent duplicate plays
  @@unique([user_id, track_id, played_at])
  @@index([user_id, played_at])
}

// Import jobs for tracking batch uploads
model import_jobs {
  id          String   @id @default(uuid())
  user_id     String
  status      String   // 'pending', 'processing', 'completed', 'failed'
  total_plays Int?
  inserted    Int?
  duplicates  Int?
  error       String?
  created_at  DateTime @default(now())
  completed_at DateTime?
}
```

**Key Database Features:**
- **Unique constraint** on `[user_id, track_id, played_at]` prevents duplicate imports
- **Prisma `skipDuplicates: true`** in batch inserts for safe re-imports
- **Indexed queries** on `user_id + played_at` for fast time-range analytics
- **Batch processing** in 1000-record chunks for large imports

---

## Authentication Flow

1. User clicks login → Spotify OAuth redirect (`src/app/page.js:87-90`)
2. Spotify callback with authorization code → captured in URL params
3. Exchange code for access token via `/api/token` (`src/app/api/token/route.js`)
4. Access token stored in state, used for all Spotify API calls
5. Token refresh handled automatically by Spotify SDK

**OAuth Scopes:**
```
user-read-recently-played user-read-private user-read-email
user-read-currently-playing user-read-playback-state
user-modify-playback-state user-top-read
```

---

## Core Features

### 1. Live Play Tracking
**Hook:** `src/hooks/usePlayTracking.js`

- Polls Spotify every 15 seconds for currently playing track
- Automatically saves new plays to database
- Detects track changes and progress
- Prevents duplicate entries via database constraint
- Works silently in background

### 2. User Top Artists
**Component:** `src/app/component/pages/info_page/user_top_artists.js`

**Time Ranges:**
- 4 Weeks (short_term)
- 6 Months (medium_term)
- 12 Months (long_term)
- All Time (database-backed)

**Performance Optimization (Split Loading):**
```javascript
const [artistsLoading, setArtistsLoading] = useState(true);
const [playCountsLoading, setPlayCountsLoading] = useState(true);
```

1. **Phase 1 (Fast):** Fetch artists from Spotify API
   - Shows artists immediately (~300ms)
   - `artistsLoading = false`

2. **Phase 2 (Background):** Fetch play counts from database
   - Tiny skeleton on play count badge only
   - `playCountsLoading = false` when complete
   - Displays: "🎵 123 plays" or "N/A plays"

**Data Sources:**
- **4 Weeks, 6 Months, 12 Months:** Spotify API + DB play counts
- **All Time:** Database only (fetches top 50, hydrates images from Spotify)

### 3. Artist Modal
**Component:** `src/app/component/pages/info_page/ArtistModal.js`

**Features:**
- Opens from top artists list OR search results
- Conditional rendering:
  - **0 plays:** "Artist not listened to" message
  - **1+ plays:** Play history area chart (Recharts)
- Genre pills (max 5, clickable, console logs)
- Skeleton loading for genres (5 pulsing pills)
- On-demand genre fetching when modal opens

**Genre Fetching Logic:**
```javascript
// Skip synthetic IDs (artist_, db-, spotify- prefixes)
// Fetch from /api/artist/[artistId] endpoint
// Shows skeleton while loading
// Caches fetched genres in state
```

### 4. Search Bar
**Component:** `src/app/main.js`
**API:** `src/app/api/search/spotify/route.js`

- Real-time Spotify artist search
- Returns: id, name, image, **genres**
- Click artist → opens ArtistModal
- Shows listening history if available in DB

### 5. History Import
**API Route:** `src/app/api/import/spotify-history/route.js`

**Process:**
1. User uploads Spotify extended streaming history JSON
2. Backend parses JSON file
3. Batch inserts in 1000-record chunks
4. Database unique constraint prevents duplicates
5. Returns `{inserted, duplicates}` count
6. Job tracking in `import_jobs` table

**Duplicate Prevention:**
- Database level: `UNIQUE([user_id, track_id, played_at])`
- Application level: `skipDuplicates: true`
- Safe to re-upload files

---

## API Routes

### Spotify Proxy Endpoints
```
GET  /api/search/spotify?q={query}          # Search artists (includes genres)
GET  /api/artist/[artistId]                 # Fetch artist details + genres
```

### Database Analytics Endpoints
```
GET  /api/stats/top-artists
     ?userId={spotifyId}
     &timeRange={short_term|medium_term|long_term|all_time}
     &limit={number}

POST /api/stats/artist-play-counts
     body: { userId, timeRange, artists: [{id, name}] }

POST /api/import/spotify-history
     multipart/form-data with JSON file
```

### Time Range Mapping
```javascript
short_term:  past 28 days   (4 weeks)
medium_term: past 180 days  (6 months)
long_term:   past 365 days  (12 months)
all_time:    no date filter (all database records)
```

---

## Component Structure

```
src/app/
├── page.js                           # Entry point, auth flow
├── main.js                           # Main orchestrator, view switcher
└── component/pages/
    ├── current_song/                 # Now Playing view (Premium only)
    │   ├── live_song.js              # Currently playing track
    │   ├── premiumTopTracks.js       # Artist top tracks
    │   ├── premiumAlbum.js           # Artist albums
    │   └── quit_song.js              # Exit now playing button
    │
    ├── info_page/                    # Stats view (all users)
    │   ├── user_top_artists.js       # Top artists with play counts
    │   ├── user_top_tracks.js        # Top tracks
    │   ├── recently_played_list.js   # Recent plays
    │   ├── ArtistModal.js            # Artist detail modal
    │   ├── floating_action.js        # FAB toggle button
    │   └── track_play_pause.js       # Track playback control
    │
    └── components/
        ├── navbar/                   # Navigation
        │   ├── connected_device.js   # Device selector
        │   ├── DropdownMenu.js       # Profile menu
        │   └── spotifyLogout.js      # Logout
        ├── control_bar/              # Playback controls
        │   ├── play_pause_button.js
        │   ├── next_button.js
        │   └── previous_button.js
        └── loading.js                # Loading overlay
```

---

## Key Implementation Patterns

### 1. Modal Animations (Framer Motion)
```javascript
<AnimatePresence mode="wait">
  {selectedArtist && (
    <ArtistModal
      key="artist-modal"
      artist={selectedArtist}
      userId={userId}
      accessToken={accessToken}
      onClose={() => setSelectedArtist(null)}
    />
  )}
</AnimatePresence>
```

### 2. Loading States (Split for Performance)
```javascript
// Fast path: Show UI immediately
setArtistsCache(spotifyData);
setArtistsLoading(false);

// Slow path: Load counts in background
const counts = await fetchPlayCounts();
setPlayCountsCache(counts);
setPlayCountsLoading(false);
```

### 3. Skeleton Loading
```javascript
{playCountsLoading ? (
  <div className="h-3 w-16 bg-[rgba(255,255,255,0.1)] rounded animate-pulse" />
) : (
  <span>{formatPlayCount(displayPlays)} plays</span>
)}
```

### 4. Genre Pills (Max 5)
```javascript
genres.slice(0, 5).map((genre, index) => (
  <button
    key={index}
    onClick={() => console.log(`🏷️ Genre clicked: "${genre}"`)}
    className="px-2 py-0.5 text-xs bg-[#282828] rounded-full"
  >
    {genre}
  </button>
))
```

---

## Responsive Design

### Mobile (< 1024px)
- Swiper carousel for navigation
- Single column layout
- Touch-optimized controls
- Stacked content sections

### Desktop (≥ 1024px)
- 3-column grid: `lg:grid-cols-3 xl:grid-cols-12`
- All sections visible simultaneously
- Horizontal scrolling for artist/track lists
- Fixed navigation

### Breakpoints (Tailwind)
```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

---

## Database Queries (Key Examples)

### Get Top Artists for Time Range
**File:** `src/lib/db/play.js`
```sql
SELECT
  COALESCE(a.spotify_id, t.artist_id) as artistId,
  COALESCE(a.name, t.artist_name) as artistName,
  COUNT(*)::bigint as playCount
FROM plays p
LEFT JOIN tracks t ON t.id = p.track_id
LEFT JOIN artists a ON a.id = t.artist_id
WHERE p.user_id = $1
  AND ($2::timestamp IS NULL OR p.played_at >= $2)
  AND ($3::timestamp IS NULL OR p.played_at <= $3)
GROUP BY artistId, artistName
ORDER BY playCount DESC
LIMIT $4
```

### Get Artist Play Count
```sql
SELECT COUNT(*)::bigint AS play_count
FROM plays p
LEFT JOIN tracks t ON t.id = p.track_id
LEFT JOIN artists ar ON ar.id = t.artist_id
WHERE p.user_id = $1
  AND p.played_at >= $2
  AND p.played_at <= $3
  AND (t.artist_id = $4 OR LOWER(COALESCE(ar.name, '')) = LOWER($5))
```

---

## Known Issues & Troubleshooting

### 1. Supabase Database Connection Instability

**Symptom:**
```
Can't reach database server at aws-1-us-east-2.pooler.supabase.com:5432
POST /api/stats/artist-play-counts 500 (Internal Server Error)
```

**Causes:**
- Free tier auto-pauses after inactivity
- Connection pooler waking up (5-10 second delay)
- Intermittent connectivity issues

**Solutions:**
1. Check Supabase dashboard: https://supabase.com/dashboard
2. Click "Resume" if project is paused
3. Wait 30-60 seconds for full database wake-up
4. Refresh application

**Monitoring:**
- Check browser console for API errors
- Check server terminal for Prisma errors
- Look for intermittent 200 responses among 500 errors

### 2. Play Counts Showing "N/A"

**Causes:**
- Database connection failure
- No plays recorded in time range
- Query timeout

**Debug:**
```bash
# Test connection
node test-prisma-connection.mjs

# Check server logs for errors
# Look for: "artist-play-counts error"
```

### 3. Genre Pills Not Loading

**Expected Behavior:**
- 5 skeleton pills while loading
- 0-5 actual genre pills when loaded
- Skips synthetic IDs (artist_, db-, spotify- prefixes)

**Troubleshooting:**
- Check network tab for `/api/artist/[artistId]` calls
- Verify artist has valid Spotify ID
- Check console for fetch errors

---

## Environment Variables

**Required:**
```env
# Spotify OAuth
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:pass@aws-1-us-east-2.pooler.supabase.com:5432/postgres"

# Database (MongoDB) - if using
MONGODB_URI="mongodb://..."
```

**Note:** Client credentials currently hardcoded in some files, should be migrated to env vars.

---

## Performance Optimizations

### 1. Split Loading States
- Artists load first from Spotify (~300ms)
- Play counts load in background from DB (~2-5s)
- Users see content immediately, counts fill in

### 2. Image Hydration
- DB queries return artist IDs without images
- Batch fetch images from Spotify (20 artists per request)
- Reduces initial query complexity

### 3. Batch Imports
- Process 1000 records per chunk
- Prevents memory overflow on large files
- Progress tracking via import_jobs

### 4. Query Indexing
```prisma
@@index([user_id, played_at])  // Fast time-range queries
@@unique([user_id, track_id, played_at])  // Duplicate prevention
```

---

## Future Enhancements (Planned)

### Radar Chart for Audio Features
**Reference File:** `radar-chart-reference.js`

- Chart.js implementation with clickable labels
- Custom plugin for interactive genre/audio feature selection
- Modal integration for detailed views
- Saved for future implementation

**Features:**
```javascript
- Clickable labels (console log on click)
- Custom styling options
- Responsive canvas sizing
- Modal trigger on label click
```

---

## Development Notes

### Premium Features
- **Now Playing view** requires Spotify Premium
- **Playback controls** require active device
- **Device selection** requires user-modify-playback-state scope

### Spotify Development Mode Limits
- Maximum 20 authorized users
- Must add user emails to allowlist
- Rate limiting: 30 requests per second
- Extended quota request required for production

### Database Maintenance
```bash
# Regenerate Prisma client after schema changes
npx prisma generate

# Run migrations
npx prisma migrate dev

# View database in Prisma Studio
npx prisma studio
```

### Common Development Tasks

**Add new API route:**
1. Create `src/app/api/[endpoint]/route.js`
2. Export `GET` or `POST` async function
3. Use `NextResponse.json()` for responses

**Add new database model:**
1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name migration_name`
3. Run `npx prisma generate`

**Add new component:**
1. Create in `src/app/component/pages/` or `src/app/component/components/`
2. Use "use client" directive if using hooks/state
3. Import in parent component

---

## Git Branch Structure

**Current branch:** `newview`
**Main branch:** `main`

**Recent commits:**
- `1835864` - notes
- `1f9e6eb` - animation
- `ebb0961` - working on artist modal
- `cb40772` - search bar is working but modal is currently not working need ideas
- `44828ba` - edited top artist modal small change

**Untracked files:**
- `radar-chart-reference.js` - Saved for future radar chart feature
- `src/app/api/artist/` - Artist details API endpoint
- `test-prisma-connection.mjs` - Database connection test script

---

## Useful Resources

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Spotify Web API Reference](https://developer.spotify.com/documentation/web-api)
- [Prisma Docs](https://www.prisma.io/docs)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Recharts Examples](https://recharts.org/en-US/examples)

---

## Quick Debugging Checklist

**Database not connecting:**
- [ ] Check Supabase dashboard for paused project
- [ ] Run `node test-prisma-connection.mjs`
- [ ] Verify `DATABASE_URL` in `.env`
- [ ] Check server terminal for Prisma errors

**Play counts showing N/A:**
- [ ] Verify database connection
- [ ] Check browser console for 500 errors
- [ ] Look for `/api/stats/artist-play-counts` failures
- [ ] Confirm data exists in database for time range

**Artist modal not opening:**
- [ ] Check console for errors
- [ ] Verify artist object has required fields (id, name)
- [ ] Check `selectedArtist` state in React DevTools
- [ ] Ensure AnimatePresence is wrapping modal

**Search not working:**
- [ ] Verify access token is valid
- [ ] Check `/api/search/spotify` endpoint
- [ ] Look for CORS or authentication errors
- [ ] Confirm Spotify API quota not exceeded

---

*Last updated: 2025-01-16*
*Version: 1.0 (newview branch)*
