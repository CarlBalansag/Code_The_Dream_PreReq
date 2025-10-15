
## Project Overview

This is a Next.js 15 application that integrates with the Spotify Web API to display currently playing music, user statistics, and control playback. The app is currently in Spotify development mode (limited to 20 authorized users)..

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
```

The development server runs on `http://127.0.0.1:3000` by default.

## Architecture

### Authentication Flow

1. User clicks login button → redirected to Spotify OAuth (`src/app/page.js:87-90`)
2. Spotify redirects back with authorization code → captured in URL params (`src/app/page.js:21-25`)
3. Code is exchanged for access token via `/api/token` route (`src/app/api/token/route.js`)
4. Access token is used for all subsequent Spotify Web API calls

### Main Application Structure

**Entry Point:** `src/app/page.js` (Home component)
- Handles Spotify OAuth flow and user authentication
- Manages global state: `accessToken`, user data, premium status, device connection
- Renders navbar and main content area

**Main Content:** `src/app/main.js` (CurrentlyPlaying component)
- Central orchestration component that decides what to render based on user state
- Manages two view modes:
  - **Info Page** (`showInfoPage: true`): User statistics (top artists, top tracks, recently played)
  - **Now Playing** (`showInfoPage: false`): Currently playing song with artist details (premium only)
- Implements responsive layouts:
  - Desktop: 3-column grid layout (`lg:grid-cols-3 xl:grid-cols-12`)
  - Mobile: Swiper carousel for navigation between views
- Polls currently playing song every 3 seconds (`src/app/main.js:67`)

### Component Organization

```
src/app/component/pages/
├── current_song/          # Now playing view (premium only)
│   ├── live_song.js       # Currently playing track with playback controls
│   ├── premiumTopTracks.js # Artist's top tracks
│   ├── premiumAlbum.js    # Artist's albums
│   └── quit_song.js       # Button to exit now playing view
├── info_page/             # Stats/info view (all users)
│   ├── user_top_artists.js
│   ├── user_top_tracks.js
│   ├── recently_played_list.js
│   ├── floating_action.js  # FAB to toggle between views
│   └── track_play_pause.js
└── components/
    ├── navbar/            # Top navigation
    │   ├── connected_device.js  # Spotify device selector/status
    │   ├── DropdownMenu.js      # User profile menu
    │   └── spotifyLogout.js
    ├── control_bar/       # Playback controls
    │   ├── play_pause_button.js
    │   ├── next_button.js
    │   └── previous_button.js
    ├── circle_play_button.js
    └── loading.js         # Loading indicator component
```

### State Management Pattern

The app uses prop drilling from the main `Home` component. Key state flows:
- `accessToken` → passed to all components that make Spotify API calls
- `premium` → determines which features are available (now playing requires premium)
- Loading states managed via callbacks (`onLoadingChange`) from child components to parent

### Loading State System

The Now Playing view implements a coordinated loading overlay system (`src/app/main.js:29-33`, `85-127`):
- Tracks loading states for: `liveSong`, `topTracks`, `albums`
- Shows full-screen loading overlay with blur when ANY component is loading
- Uses React Portal to render loading overlay at document.body level
- Prevents scrolling and interaction during loading

### API Integration

All Spotify API calls use bearer token authentication with the `accessToken`.

**Key API endpoints used:**
- `GET /v1/me` - User profile
- `GET /v1/me/player/currently-playing` - Current playback (`src/app/component/pages/current_song/live_song.js:10-25`)
- `GET /v1/me/player/devices` - Available Spotify Connect devices
- `PUT /v1/me/player` - Transfer playback to device
- Playback control endpoints (play/pause/next/previous)
- User top tracks/artists endpoints

### Responsive Design

The app uses Tailwind CSS with a mobile-first approach:
- Mobile: Swiper.js carousel for navigation between content sections
- Desktop (`lg:` breakpoint): Grid layout with all sections visible
- Premium features (now playing) show different swiper configurations on mobile

## Key Technical Details

**Next.js Configuration (`next.config.mjs`):**
- Exposes Spotify credentials as environment variables (currently using `process.env`)
- Configures allowed image domains: `i.scdn.co`, Facebook CDN domains

**Spotify OAuth Scopes:**
```
user-read-recently-played user-read-private user-read-email
user-read-currently-playing user-read-playback-state
user-modify-playback-state user-top-read
```

**Technology Stack:**
- Next.js 15.3.1 (App Router)
- React 19
- Tailwind CSS 4
- Swiper.js for carousels
- Ark UI React components
- Lucide React for icons

## Important Notes

- **Development Mode Limitation:** Only 20 users can access the app while in Spotify development mode. User emails must be provided to the project owner to be added to the allowlist.
- **Hardcoded Credentials:** Client ID and secret are currently in source code, not environment variables.
- **Premium Features:** The "Now Playing" view with live song display and playback controls requires Spotify Premium.
- **Device Connection:** Users must have an active Spotify device (desktop app, mobile app, web player) to see currently playing content.
