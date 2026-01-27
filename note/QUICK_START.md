# Quick Start Guide - Play Tracking System

## TL;DR - Get Started in 5 Minutes

### 1. Start the App
```bash
npm run dev
```

### 2. Log In
Go to `http://127.0.0.1:3000` and click "Continue to Spotify"

### 3. Verify Tracking
Open browser console (F12), you should see:
```
🔄 Starting initial import for user: your_spotify_id
✅ Initial import complete for Your Name
   Imported: 50 plays
```

### 4. Let It Run
Keep the app open in your browser. It will automatically:
- Poll Spotify every 3 minutes
- Track all songs you play
- Store everything in MongoDB

### 5. Test It Works
Play a song on Spotify, wait 3-5 minutes, check console:
```
🔄 Polling for new plays...
✅ Found 1 new plays
🎵 Detected 1 new plays!
```

## That's It!

Your app is now tracking all your Spotify plays automatically.

## Quick Commands

### Check your stats
```bash
node test-tracking.js
```

### Manually check for new plays
```bash
curl -X POST http://127.0.0.1:3000/api/poll/plays \
  -H "Content-Type: application/json" \
  -d '{"spotifyId":"your_spotify_id"}'
```

### View in MongoDB Compass
1. Open MongoDB Compass
2. Connect to your database
3. Browse `plays` collection

## Next Steps

Now that tracking works, you can:

1. **Build Stats UI** - Display your top tracks, artists, listening time
2. **Add Charts** - Visualize listening trends over time
3. **Import History** - Upload your full Spotify history ZIP
4. **Add Features** - Milestones, achievements, sharing

## Need Help?

- **Detailed Guide:** Read `TRACKING_GUIDE.md`
- **How It Works:** Read `IMPLEMENTATION_SUMMARY.md`
- **Database Setup:** Read `DATABASE_SETUP.md`
- **Test Script:** Run `node test-tracking.js`

## Troubleshooting

### Not seeing plays?
1. Check browser console for errors
2. Run `node test-tracking.js`
3. Check MongoDB Compass for plays collection

### Polling not working?
1. Make sure app is open in browser
2. Check console for "🔄 Polling for new plays..."
3. Verify you're logged in

### Token expired?
Just log out and log back in.

---

**You're all set!** 🎵 Your plays are being tracked automatically.
