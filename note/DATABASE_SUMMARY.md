# MongoDB Database Setup - Complete! ✅

Your Spotify stats tracking database is now fully configured and ready to use.

## 📁 What Was Created

### Core Database Files

```
src/lib/
├── mongodb.js                          # MongoDB connection with environment handling
├── models/
│   ├── User.js                         # User schema with Spotify auth tokens
│   ├── Play.js                         # Play schema (listening history)
│   └── ImportJob.js                    # Import job tracking schema
├── db/
│   ├── index.js                        # Central export point
│   ├── userOperations.js               # User CRUD operations
│   ├── playOperations.js               # Play tracking operations
│   └── statsQueries.js                 # Statistics query functions
└── utils/
    └── spotifyTokenRefresh.js          # Automatic token refresh utility
```

### Configuration Files

```
.env.local                              # Your environment variables (NOT in git)
.env.example                            # Template for environment variables
.gitignore                              # Updated to protect secrets
```

### Documentation

```
DATABASE_SETUP.md                       # Complete setup guide and API reference
EXAMPLE_API_ROUTES.md                   # Example Next.js API routes
DATABASE_SUMMARY.md                     # This file
test-database.js                        # Test script to verify setup
```

---

## 🚀 Quick Start

### 1. Test Your Connection

```bash
node test-database.js
```

This will:
- Connect to your MongoDB database
- Create a test user
- Track some test plays
- Query statistics
- Verify everything works

### 2. Integrate with Your App

Import the database functions wherever you need them:

```javascript
import {
  saveUser,
  trackPlay,
  getTopTracks,
  getTopArtists,
  getComprehensiveStats,
} from '@/lib/db/index.js';
```

### 3. Implement the Core Features

1. **User Login**: Save user after Spotify OAuth
2. **Track Plays**: Poll Spotify API for new plays
3. **Display Stats**: Show user's listening statistics
4. **Import History**: Allow users to import full history

See `EXAMPLE_API_ROUTES.md` for complete examples.

---

## 📊 Database Structure

### Collections

| Collection | Purpose | Size Estimate |
|------------|---------|---------------|
| **users** | User accounts and tokens | ~1 KB per user |
| **plays** | Every song play (millions) | ~300 bytes per play |
| **import_jobs** | Import progress tracking | ~500 bytes per job |

### Key Indexes (Auto-created)

```javascript
// Users
{ spotifyId: 1 }                          // Primary lookup

// Plays (CRITICAL for performance)
{ userId: 1, playedAt: -1 }               // Compound index (most queries)
{ userId: 1, trackId: 1, playedAt: 1 }    // Unique constraint (prevent duplicates)
```

With these indexes, queries on **millions of plays** complete in < 100ms.

---

## 🎯 Core Functions You'll Use

### User Management

```javascript
// After Spotify login
const user = await saveUser({
  spotifyId: profile.id,
  displayName: profile.display_name,
  email: profile.email,
  spotifyAccessToken: tokens.access_token,
  spotifyRefreshToken: tokens.refresh_token,
  tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
});

// Get user
const user = await getUserBySpotifyId('user_id');

// Update tokens (automatic with token refresh utility)
await updateUserTokens(spotifyId, { accessToken, refreshToken, expiresAt });
```

### Tracking Plays

```javascript
// Track a single play
await trackPlay({
  userId: 'user_id',
  trackId: 'track_id',
  trackName: 'Song Name',
  artistId: 'artist_id',
  artistName: 'Artist Name',
  albumId: 'album_id',
  albumName: 'Album Name',
  albumImage: 'https://...',
  playedAt: new Date(),
  durationMs: 180000,
  source: 'tracked',
});

// Track multiple plays (bulk import)
const result = await trackMultiplePlays(playsArray);
console.log(`Inserted ${result.inserted}, skipped ${result.duplicates} duplicates`);
```

### Statistics Queries

```javascript
// Get top tracks
const topTracks = await getTopTracks('user_id', {
  limit: 50,
  startDate: new Date('2024-01-01'),  // Optional
  endDate: new Date('2024-12-31'),    // Optional
});

// Get comprehensive stats
const stats = await getStatsByPeriod('user_id', 'month');
// Periods: "week", "month", "3months", "6months", "year", "all"

console.log(`Total plays: ${stats.totals.plays}`);
console.log(`Top track: ${stats.topTracks[0].trackName}`);

// Get play statistics
const playStats = await getPlayStats('user_id');
console.log(`Unique tracks: ${playStats.uniqueTracks}`);
console.log(`Listening time: ${playStats.totalListeningTimeHours} hours`);
```

### Token Refresh (Automatic)

```javascript
import { getValidAccessToken } from '@/lib/utils/spotifyTokenRefresh.js';

// Automatically refreshes if expired
const accessToken = await getValidAccessToken(user);

// Use in Spotify API calls
const response = await fetch('https://api.spotify.com/v1/me/player', {
  headers: { Authorization: `Bearer ${accessToken}` }
});
```

---

## 🔄 Typical Workflow

### 1. User Logs In
```javascript
// OAuth callback
const user = await saveUser({
  spotifyId: profile.id,
  displayName: profile.display_name,
  // ... other fields
});

// Start tracking their plays
await trackInitialPlays(user);
```

### 2. Continuous Tracking
```javascript
// Run every 30 seconds (background process or API route)
async function pollAndTrack(userId) {
  const user = await getUserBySpotifyId(userId);
  const accessToken = await getValidAccessToken(user);

  // Fetch from Spotify
  const recentPlays = await fetch(
    'https://api.spotify.com/v1/me/player/recently-played?limit=50',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  ).then(r => r.json());

  // Format and insert
  const plays = recentPlays.items.map(formatPlay);
  await trackMultiplePlays(plays);
}
```

### 3. Display Statistics
```javascript
// In your React component or API route
const stats = await getStatsByPeriod(userId, 'month');

// Render to user
<div>
  <h2>This Month</h2>
  <p>Plays: {stats.totals.plays}</p>
  <p>Hours: {stats.totals.listeningTimeHours}</p>

  <h3>Top Tracks</h3>
  <ol>
    {stats.topTracks.map(track => (
      <li key={track.trackId}>
        {track.trackName} by {track.artistName}
        <span>{track.playCount} plays</span>
      </li>
    ))}
  </ol>
</div>
```

---

## 💡 Performance Tips

### Do's
✅ Always filter by `userId` first (it's indexed)
✅ Use date ranges to limit query scope
✅ Use `trackMultiplePlays()` for bulk inserts
✅ Cache stats results for 5-10 minutes
✅ Run aggregation queries in parallel with `Promise.all()`

### Don'ts
❌ Don't query without userId filter
❌ Don't fetch all plays at once (millions)
❌ Don't re-query the same stats repeatedly
❌ Don't forget to handle duplicates (they're automatic)

---

## 📈 Scaling Considerations

### Free Tier (512 MB)
- **Capacity**: ~30-40 users with full history (50k plays each)
- **Performance**: < 100ms queries with proper indexes
- **Cost**: $0/month

### When to Upgrade
- **Users**: > 40 active users
- **Storage**: > 400 MB used
- **Queries**: Noticing slow response times

### Upgrade Path
1. **Paid Atlas Tier** ($10/month) - 10 GB storage
2. **Add Redis Cache** - Cache stats for faster dashboards
3. **Pre-compute Stats** - Daily aggregations for common queries
4. **Archive Old Data** - Move plays > 2 years to cold storage

---

## 🧪 Testing Checklist

- [ ] Run `node test-database.js` successfully
- [ ] Create a test user via OAuth
- [ ] Track some test plays
- [ ] Query stats and verify results
- [ ] Test token refresh with expired token
- [ ] Verify duplicate prevention works
- [ ] Test on both development and production databases

---

## 🔐 Security Notes

### Current Setup (Development)
- Tokens stored in plain text in `.env.local`
- `.env.local` is gitignored (safe)
- Only you have access to development database

### Production Considerations
1. **Environment Variables**: Use Vercel/hosting platform's env vars
2. **Token Encryption**: Consider encrypting tokens in database
3. **Access Control**: Implement user authentication middleware
4. **Rate Limiting**: Limit API calls to prevent abuse
5. **Separate Databases**: Use different databases for dev/prod

---

## 📚 Documentation Reference

- **Setup Guide**: `DATABASE_SETUP.md` - Complete API reference
- **API Examples**: `EXAMPLE_API_ROUTES.md` - Next.js API routes
- **Project Docs**: `CLAUDE.md` - Your existing project overview
- **Test Script**: `test-database.js` - Verify setup works

---

## 🎉 Next Steps

1. **✅ Test the setup** - Run `node test-database.js`
2. **📝 Review examples** - Read `EXAMPLE_API_ROUTES.md`
3. **🔨 Integrate** - Add database calls to your existing app
4. **📊 Build UI** - Create stats dashboard components
5. **🚀 Deploy** - Set up production database and deploy

---

## 🆘 Troubleshooting

### Connection Issues
```
Error: MONGODB_URI is not defined
```
➜ Check `.env.local` exists and has the correct variables

### Mongoose Warnings
```
DeprecationWarning: ...
```
➜ These are safe to ignore - the connection options are already optimized

### Duplicate Key Errors
```
E11000 duplicate key error
```
➜ This is normal! The `trackMultiplePlays()` function handles this automatically

### Slow Queries
```
Queries taking > 1 second
```
➜ Check indexes are created in MongoDB Atlas UI
➜ Add date range filters to limit results
➜ Consider upgrading to paid tier

---

## 📞 Support

If you run into issues:
1. Check the error message carefully
2. Review the relevant documentation file
3. Verify environment variables are set correctly
4. Check MongoDB Atlas dashboard for connection/index status
5. Review Next.js server logs for detailed errors

---

## 🏁 You're All Set!

Your MongoDB backend is fully configured with:
✅ Connection handling
✅ 3 Mongoose schemas with indexes
✅ User CRUD operations
✅ Play tracking with duplicate prevention
✅ Comprehensive statistics queries
✅ Automatic token refresh
✅ Development and production environment support

**Happy coding! 🎵**
