# Comprehensive Security & Code Quality Review

## Code Review Summary

This is a Next.js application integrating with Spotify's API to track and visualize user listening history. The application uses PostgreSQL with Prisma ORM for data persistence. While the application demonstrates solid architecture in some areas, there are **critical security vulnerabilities** that must be addressed immediately before this application can be considered production-ready.

### Overall Assessment

**Security Grade: D (Critical vulnerabilities present)**
**Code Quality Grade: C+ (Mixed - good structure, poor security practices)**

The application shows good understanding of React patterns, database design, and API architecture, but contains severe security flaws including hardcoded credentials in source code and insufficient input validation. These issues pose immediate risks of credential theft, unauthorized access, and potential data breaches.

---

## Critical Security Issues (MUST FIX IMMEDIATELY)

### 1. [CRITICAL] Hardcoded Spotify API Credentials in Source Code

**Location:**
- `src/app/api/token/route.js` (Lines 10-11)
- `src/app/page.js` (Line 10)

**Issue:**
```javascript
// src/app/api/token/route.js
const CLIENT_ID = "2751136537024052b892a475c49906e1";
const CLIENT_SECRET = "08a90bbbd1a04c2486bb40daf52d0212";
```

**Why This Is Critical:**
- **OWASP Top 10: A02:2021  Cryptographic Failures** - Exposed secrets in source code
- Client secrets are visible to anyone with repository access
- If this code is committed to version control (even private repos), credentials are permanently exposed in git history
- Attackers can use these credentials to impersonate your application, access user data, or exhaust rate limits
- Spotify will revoke these credentials if they detect exposure, breaking your app

**Impact:** Anyone with access to this code can steal your Spotify API credentials and:
1. Make unauthorized API calls on your behalf
2. Access all user data your app has permissions for
3. Exhaust your API rate limits
4. Get your application banned from Spotify

**Remediation:**
1. **IMMEDIATELY** rotate these credentials in Spotify Developer Dashboard
2. Move credentials to environment variables:

```javascript
// src/app/api/token/route.js
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error('Missing Spotify credentials in environment variables');
}
```

3. Add to `.env.local` (already in `.gitignore`):
```bash
SPOTIFY_CLIENT_ID=your_new_client_id
SPOTIFY_CLIENT_SECRET=your_new_client_secret
```

4. For the client-side code in `page.js`:
```javascript
// src/app/page.js
const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
```

5. **Check git history** - if these credentials were ever committed, you MUST rotate them:
```bash
git log -p -- src/app/api/token/route.js
```

---

### 2. [CRITICAL] Access Token Exposure in URL Query Parameters

**Location:**
- `src/app/api/search/spotify/route.js` (Line 7)
- `src/app/api/artist/[artistId]/route.js` (Line 11)
- Multiple client-side components passing tokens in URLs

**Issue:**
```javascript
// src/app/api/search/spotify/route.js
const accessToken = searchParams.get('accessToken');

// Client-side usage:
const response = await fetch(
  `/api/artist/${artist.id}?accessToken=${encodeURIComponent(accessToken)}`
);
```

**Why This Is Critical:**
- **OWASP Top 10: A01:2021  Broken Access Control**
- Access tokens in URLs are logged in:
  - Browser history
  - Server access logs
  - Proxy logs
  - Referrer headers when navigating to external sites
  - Browser extensions can read them
- Tokens can be stolen via XSS or browser history access
- URLs are often shared/copied, leaking tokens

**Impact:**
- User access tokens exposed in multiple logging systems
- Tokens can be intercepted and used to impersonate users
- Violates OAuth 2.0 security best practices

**Remediation:**

**Option 1: Use HTTP-Only Cookies (RECOMMENDED)**
```javascript
// src/app/api/token/route.js
export async function POST(req) {
  // ... existing code ...

  const response = Response.json({
    user: savedUser,
    // Don't send tokens to client
  });

  // Set HTTP-only cookie
  response.cookies.set('spotify_access_token', tokenData.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: tokenData.expires_in
  });

  return response;
}

// API routes automatically receive cookies:
export async function GET(req) {
  const accessToken = req.cookies.get('spotify_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... use token ...
}
```

**Option 2: Use Authorization Headers (Alternative)**
```javascript
// Client-side:
const response = await fetch('/api/search/spotify?query=...', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// Server-side:
export async function GET(req) {
  const authHeader = req.headers.get('authorization');
  const accessToken = authHeader?.replace('Bearer ', '');

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... use token ...
}
```

---

### 3. [HIGH] SQL Injection via Unsanitized Input in Raw Queries

**Location:** `src/lib/db/play.js`

**Issue:**
While you're using Prisma's parameterized queries correctly in most places, there's potential risk in how user input flows through to database queries. The timezone parameter in particular:

```javascript
// src/lib/db/play.js (line ~290)
export async function getArtistDailyHistory({
  userId,
  artistId,
  artistName,
  startDate,
  endDate,
  timezone,  //   User-controlled input
}) {
  const rows = await prisma.$queryRaw`
    WITH total_by_day AS (
      SELECT
        (p.played_at AT TIME ZONE ${timezone})::date AS date_key,
        // ...
```

**Why This Is High Risk:**
- **OWASP Top 10: A03:2021  Injection**
- The `timezone` parameter comes from client-side (`Intl.DateTimeFormat().resolvedOptions().timeZone`)
- While Prisma sanitizes parameters in `$queryRaw`, malformed timezone strings could cause errors
- If timezone validation is bypassed, could lead to query errors or unexpected behavior

**Current Protection:** Prisma's template literal sanitization provides some protection, but it's not foolproof.

**Remediation:**
```javascript
// src/app/api/stats/artist-history/[artistId]/route.js
const VALID_TIMEZONES = new Set([
  'UTC', 'America/New_York', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Asia/Tokyo',
  // Add all IANA timezone identifiers you support
]);

function validateTimezone(tz) {
  // Validate against IANA timezone database
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return tz;
  } catch (e) {
    return 'UTC'; // Default to UTC if invalid
  }
}

// In the route handler:
const localTimezone = validateTimezone(
  searchParams.get('timezone') || 'UTC'
);
```

---

### 4. [HIGH] No Rate Limiting on API Endpoints

**Location:** All API routes in `src/app/api/`

**Issue:**
None of your API routes implement rate limiting. This allows:
- Brute force attacks on search endpoints
- DoS attacks by flooding import endpoints
- Excessive database queries
- Spotify API quota exhaustion

**Why This Is High Risk:**
- **OWASP Top 10: A04:2021  Insecure Design**
- Attackers can exhaust your Spotify API quotas
- Database can be overwhelmed with queries
- Server costs can spike from abuse
- Legitimate users get degraded service

**Remediation:**

Install rate limiting middleware:
```bash
npm install @upstash/ratelimit @upstash/redis
```

Create rate limit middleware:
```javascript
// src/middleware.js
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
  analytics: true,
});

export async function middleware(request) {
  // Skip rate limiting for static files
  if (request.nextUrl.pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // Rate limit API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip ?? '127.0.0.1';
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(reset).toISOString(),
          }
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

---

### 5. [HIGH] No CSRF Protection

**Location:** All POST/PUT/DELETE API routes

**Issue:**
Your application has no CSRF protection. All state-changing operations are vulnerable to Cross-Site Request Forgery attacks.

**Why This Is High Risk:**
- **OWASP Top 10: A01:2021  Broken Access Control**
- Attackers can trick authenticated users into making unwanted requests
- Import endpoints can be abused to upload malicious data
- User data can be modified without consent

**Attack Scenario:**
```html
<!-- Malicious site -->
<form action="http://yourapp.com/api/import/spotify-history" method="POST">
  <input name="userId" value="victim_id">
  <input name="file" value="malicious_data">
</form>
<script>document.forms[0].submit();</script>
```

**Remediation:**

Next.js doesn't have built-in CSRF protection for API routes. Implement token-based protection:

```javascript
// src/lib/csrf.js
import crypto from 'crypto';

export function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function validateCSRFToken(token, expectedToken) {
  if (!token || !expectedToken) return false;
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(expectedToken)
  );
}

// In your API routes:
export async function POST(req) {
  const csrfToken = req.headers.get('x-csrf-token');
  const expectedToken = req.cookies.get('csrf_token')?.value;

  if (!validateCSRFToken(csrfToken, expectedToken)) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }

  // ... rest of handler
}
```

---

## High Priority Security Issues

### 6. [HIGH] Insufficient Input Validation on File Upload

**Location:** `src/app/api/import/spotify-history/route.js`

**Issue:**
```javascript
// File size is not validated
const fileText = await file.text(); // No size limit - can cause DoS

// File name validation is weak
if (!file.name.endsWith('.json')) {
  return NextResponse.json(
    { error: `File ${file.name} must be a JSON file` },
    { status: 400 }
  );
}
```

**Why This Is High Risk:**
- No file size limit - attackers can upload multi-GB files causing memory exhaustion
- No content-type validation - relies only on file extension
- JSON parsing can cause DoS with deeply nested objects
- No limit on array size in JSON

**Remediation:**
```javascript
export async function POST(req) {
  const formData = await req.formData();
  const files = formData.getAll('files');
  const userId = formData.get('userId');

  // Validate file count
  const MAX_FILES = 10;
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Maximum ${MAX_FILES} files allowed` },
      { status: 400 }
    );
  }

  for (const file of files) {
    // Validate file size (10MB max)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File ${file.name} exceeds maximum size of 10MB` },
        { status: 400 }
      );
    }

    // Validate content type
    if (file.type !== 'application/json') {
      return NextResponse.json(
        { error: `File ${file.name} must be JSON (got ${file.type})` },
        { status: 400 }
      );
    }

    // Validate file extension
    if (!file.name.endsWith('.json')) {
      return NextResponse.json(
        { error: `File ${file.name} must have .json extension` },
        { status: 400 }
      );
    }

    const fileText = await file.text();

    // Validate JSON size after reading
    if (fileText.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File ${file.name} content too large` },
        { status: 400 }
      );
    }

    let spotifyData;
    try {
      spotifyData = JSON.parse(fileText);
    } catch (err) {
      return NextResponse.json(
        { error: `Invalid JSON in ${file.name}: ${err.message}` },
        { status: 400 }
      );
    }

    // Validate array size
    const MAX_RECORDS = 100000; // 100k records
    if (spotifyData.length > MAX_RECORDS) {
      return NextResponse.json(
        { error: `File ${file.name} has too many records (max ${MAX_RECORDS})` },
        { status: 400 }
      );
    }
  }

  // ... rest of processing
}
```

---

### 7. [HIGH] Missing Authorization Checks on User Data Access

**Location:** Multiple API routes

**Issue:**
```javascript
// src/app/api/stats/top-artists/route.js
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId'); //   User-provided, no verification

  // No check if requester is authorized to see this user's data
  const artists = await getTopArtists(userId, { /* ... */ });

  return NextResponse.json({ artists });
}
```

**Why This Is High Risk:**
- **OWASP Top 10: A01:2021  Broken Access Control**
- Any authenticated user can view any other user's data by changing the `userId` parameter
- No session validation or authorization checks
- Allows enumeration of user data

**Impact:**
- User A can view User B's listening history by guessing/enumerating User IDs
- Privacy violation - all user listening data is exposed

**Remediation:**

Implement proper session-based authorization:

```javascript
// src/lib/auth.js
export async function getCurrentUser(req) {
  const accessToken = req.cookies.get('spotify_access_token')?.value;

  if (!accessToken) {
    return null;
  }

  // Verify token with Spotify
  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    return null;
  }

  const profile = await response.json();
  return profile.id; // Spotify user ID
}

// In your API routes:
export async function GET(req) {
  const currentUserId = await getCurrentUser(req);

  if (!currentUserId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const requestedUserId = searchParams.get('userId');

  // Ensure users can only access their own data
  if (currentUserId !== requestedUserId) {
    return NextResponse.json(
      { error: 'Forbidden - can only access your own data' },
      { status: 403 }
    );
  }

  const artists = await getTopArtists(currentUserId, { /* ... */ });
  return NextResponse.json({ artists });
}
```

---

### 8. [HIGH] Sensitive Data Logged to Console

**Location:** Throughout the codebase

**Issue:**
```javascript
// src/app/api/token/route.js
console.log("<¯ TOKEN RESPONSE:", tokenData); // Contains access_token, refresh_token
console.log("=d Spotify user profile:", userProfile); // Contains email, personal data

// src/app/api/stats/artist-history/[artistId]/route.js
console.log(`=Ê Fetching top artists for user: ${userId}`); // Logs user IDs
```

**Why This Is High Risk:**
- **OWASP Top 10: A09:2021  Security Logging and Monitoring Failures**
- Access tokens and refresh tokens in logs can be stolen
- Logs may be stored in plaintext
- Logs may be accessible to unauthorized personnel
- PII (emails, user IDs) in logs may violate privacy regulations (GDPR, CCPA)

**Remediation:**
```javascript
// Create a safe logger utility
// src/lib/logger.js
const SENSITIVE_FIELDS = ['access_token', 'refresh_token', 'email', 'password'];

export function sanitizeForLogging(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;

  const sanitized = { ...obj };
  for (const field of SENSITIVE_FIELDS) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  return sanitized;
}

export const logger = {
  info: (message, data) => {
    console.log(message, data ? sanitizeForLogging(data) : '');
  },
  error: (message, error) => {
    console.error(message, {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Usage:
import { logger } from '@/lib/logger';

logger.info("<¯ Token exchange response:", tokenData); // Automatically redacts tokens
logger.error("L Failed to fetch user data:", error);
```

---

## Medium Priority Issues

### 9. [MEDIUM] XSS Vulnerability via Unvalidated Artist Names

**Location:**
- `src/app/component/pages/info_page/ArtistModal.js`
- `src/app/component/pages/info_page/user_top_artists.js`

**Issue:**
```javascript
// ArtistModal.js
<h2 className="text-base sm:text-lg font-bold text-white truncate">
  {artist.name} //   Unvalidated user-controlled data
</h2>

// user_top_artists.js
<p className="text-white font-semibold text-[15px] text-center mb-2 truncate">
  {artist.name}
</p>
```

**Why This Is Medium Risk:**
- **OWASP Top 10: A03:2021  Injection (XSS)**
- While React escapes JSX by default, data from external APIs (Spotify) should still be validated
- If an artist name contains unexpected characters or the Spotify API is compromised, XSS could occur
- Artist names from database (synthetic IDs) are even less trustworthy

**Note:** React's JSX provides automatic escaping, so this is lower risk than in vanilla HTML. However, best practice is still to validate/sanitize.

**Remediation:**
```javascript
// src/lib/sanitize.js
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeText(text) {
  if (!text) return '';
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}

// Usage:
import { sanitizeText } from '@/lib/sanitize';

<h2 className="...">
  {sanitizeText(artist.name)}
</h2>
```

Or use a validation library:
```javascript
import validator from 'validator';

export function validateArtistName(name) {
  if (!name || typeof name !== 'string') return 'Unknown Artist';

  // Remove any HTML tags
  const cleaned = name.replace(/<[^>]*>/g, '');

  // Limit length
  const truncated = cleaned.slice(0, 200);

  return truncated || 'Unknown Artist';
}
```

---

### 10. [MEDIUM] No Content Security Policy (CSP)

**Location:** Application-wide

**Issue:**
Your application has no Content Security Policy headers, leaving it vulnerable to XSS attacks.

**Why This Is Medium Risk:**
- **OWASP Top 10: A05:2021  Security Misconfiguration**
- CSP provides defense-in-depth against XSS
- Inline scripts and styles are allowed (risky)
- No restriction on resource loading

**Remediation:**

Add CSP headers in `next.config.mjs`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-inline/eval
              "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
              "img-src 'self' data: https://i.scdn.co https://images.unsplash.com",
              "font-src 'self' data:",
              "connect-src 'self' https://api.spotify.com https://accounts.spotify.com",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },

  // ... rest of config
};
```

---

### 11. [MEDIUM] Unencrypted HTTP Redirect URI in Production

**Location:** `src/app/page.js`

**Issue:**
```javascript
const REDIRECT_URI = "http://127.0.0.1:3000"; //   HTTP, not HTTPS
```

**Why This Is Medium Risk:**
- OAuth authorization codes transmitted over unencrypted HTTP
- Man-in-the-middle attacks can steal auth codes
- Violates OAuth 2.0 security recommendations

**Remediation:**
```javascript
const REDIRECT_URI = process.env.NODE_ENV === 'production'
  ? 'https://yourapp.com/callback'
  : 'http://127.0.0.1:3000';
```

And configure HTTPS for production deployment.

---

### 12. [MEDIUM] Database Connection String Potentially Exposed

**Location:** Environment variables referenced but not visible

**Issue:**
Prisma uses `DATABASE_URL` from environment. Need to verify:
1. Connection string doesn't contain credentials in plaintext
2. Database user has minimum required permissions
3. SSL/TLS is enforced for database connections

**Remediation:**
```javascript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // Force SSL in production
  ssl = {
    enabled = true
    rejectUnauthorized = true
  }
}
```

Ensure `.env.local` contains:
```bash
# Use connection pooling for better security and performance
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require&connection_limit=10"
```

Create a dedicated database user with limited permissions:
```sql
-- Create read-write user (not superuser)
CREATE USER spotify_app WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE spotify_db TO spotify_app;
GRANT USAGE ON SCHEMA public TO spotify_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO spotify_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO spotify_app;

-- Revoke dangerous permissions
REVOKE CREATE ON SCHEMA public FROM spotify_app;
REVOKE DROP ON ALL TABLES IN SCHEMA public FROM spotify_app;
```

---

## Code Quality Issues

### 13. [IMPROVEMENT] Missing Error Boundaries in React Components

**Location:** `src/app/main.js` and child components

**Issue:**
No error boundaries to catch rendering errors, meaning a single component error can crash the entire app.

**Remediation:**
```javascript
// src/app/components/ErrorBoundary.js
"use client";

import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error tracking service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-400 mb-4">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-green-500 rounded"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap your app:
<ErrorBoundary>
  <CurrentlyPlaying {...props} />
</ErrorBoundary>
```

---

### 14. [IMPROVEMENT] Potential Memory Leak in useEffect Cleanup

**Location:** `src/hooks/useArtistHistory.js`

**Issue:**
The cleanup in `useEffect` aborts requests, but there's a potential race condition if `fetchData` is called again before cleanup runs.

**Current Code:**
```javascript
useEffect(() => {
  if (enabled) {
    fetchData();
  }

  return () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };
}, [enabled, fetchData]);
```

**Better Implementation:**
```javascript
useEffect(() => {
  let cancelled = false;
  const abortController = new AbortController();

  const fetchData = async () => {
    if (!artistId || !userId || !enabled) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(url, {
        signal: abortController.signal,
      });

      const result = await response.json();

      // Only update state if not cancelled
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (!cancelled) {
        setError(err.message);
        setLoading(false);
      }
    }
  };

  if (enabled) {
    fetchData();
  }

  return () => {
    cancelled = true;
    abortController.abort();
  };
}, [artistId, userId, timeRange, enabled]);
```

---

### 15. [IMPROVEMENT] Inconsistent Error Handling

**Location:** Multiple API routes

**Issue:**
Error responses are inconsistent across routes. Some return `{ error, message }`, others just `{ error }`.

**Remediation:**

Create a standard error response utility:
```javascript
// src/lib/api/errors.js
export class APIError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function errorResponse(error) {
  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          details: error.details,
          timestamp: new Date().toISOString()
        }
      },
      { status: error.statusCode }
    );
  }

  // Log unexpected errors
  console.error('Unexpected error:', error);

  return NextResponse.json(
    {
      error: {
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      }
    },
    { status: 500 }
  );
}

// Usage:
export async function GET(req) {
  try {
    if (!userId) {
      throw new APIError('userId is required', 400);
    }

    // ... business logic

  } catch (error) {
    return errorResponse(error);
  }
}
```

---

### 16. [IMPROVEMENT] No Request Timeout Configuration

**Location:** All `fetch` calls

**Issue:**
Fetch calls have no timeout, meaning they can hang indefinitely if external APIs don't respond.

**Remediation:**
```javascript
// src/lib/api/fetch-with-timeout.js
export async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// Usage:
const response = await fetchWithTimeout(
  'https://api.spotify.com/v1/me',
  { headers: { Authorization: `Bearer ${token}` } },
  5000 // 5 second timeout
);
```

---

### 17. [IMPROVEMENT] Missing Index on Frequently Queried Columns

**Location:** Prisma schema has good indexes, but verify with query analysis

**Recommendation:**
Run `EXPLAIN ANALYZE` on your most common queries to verify indexes are being used:

```sql
-- Check if indexes are used
EXPLAIN ANALYZE
SELECT COUNT(*) FROM plays
WHERE user_id = 'some_user_id'
AND played_at >= '2024-01-01';

-- Should show "Index Scan" not "Seq Scan"
```

Consider adding composite indexes for common query patterns:
```prisma
model plays {
  // ... existing fields

  @@index([user_id, played_at(sort: Desc), track_id])
  @@index([track_id, played_at(sort: Desc)])
}
```

---

### 18. [IMPROVEMENT] No Pagination on Large Data Sets

**Location:** `src/app/api/stats/top-artists/route.js`

**Issue:**
```javascript
const limit = parseInt(searchParams.get('limit') || '50');
```

There's a limit, but no offset/pagination. Users can't navigate through results beyond the first page.

**Remediation:**
```javascript
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100
  const offset = parseInt(searchParams.get('offset') || '0');

  const artists = await getTopArtists(userId, {
    startDate,
    endDate,
    limit,
    offset
  });

  const total = await countTopArtists(userId, { startDate, endDate });

  return NextResponse.json({
    artists,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + artists.length < total
    }
  });
}
```

---

## Additional Recommendations

### Security Best Practices

1. **Implement Security Headers** (as shown in issue #10)
2. **Add Request ID Tracing** for debugging and security monitoring
3. **Implement Audit Logging** for sensitive operations (data access, exports, imports)
4. **Add Health Check Endpoint** for monitoring
5. **Implement Graceful Degradation** when Spotify API is down
6. **Add Input Validation Library** (Zod, Yup, or Joi) for consistent validation

### Code Quality Improvements

1. **Add TypeScript** for type safety (Next.js supports it out of the box)
2. **Implement Unit Tests** for critical business logic (database functions, data transformations)
3. **Add E2E Tests** for critical user flows (Playwright/Cypress)
4. **Set Up ESLint Security Rules**:
```bash
npm install --save-dev eslint-plugin-security
```

```javascript
// eslint.config.mjs
import security from 'eslint-plugin-security';

export default [
  {
    plugins: {
      security
    },
    rules: {
      ...security.configs.recommended.rules
    }
  }
];
```

5. **Add Pre-commit Hooks** to prevent committing secrets:
```bash
npm install --save-dev husky lint-staged
```

```json
// package.json
{
  "lint-staged": {
    "*.{js,jsx}": [
      "eslint --fix",
      "git-secrets --scan"
    ]
  }
}
```

---

## Recommendation Summary

### Must Fix Before Production (Critical)
1. Remove hardcoded Spotify credentials and rotate keys
2. Move access tokens out of URL parameters to HTTP-only cookies or headers
3. Add proper authorization checks on all user data endpoints
4. Implement rate limiting on all API routes
5. Add CSRF protection for state-changing operations

### Should Fix Soon (High Priority)
6. Improve file upload validation (size limits, content validation)
7. Stop logging sensitive data (tokens, emails, PII)
8. Add request timeouts to all external API calls
9. Implement proper error handling with sanitized error responses

### Nice to Have (Medium Priority)
10. Add Content Security Policy headers
11. Add React Error Boundaries
12. Implement pagination for large datasets
13. Add comprehensive input validation with a library (Zod)
14. Set up security-focused ESLint rules

---

## Strengths

Despite the security issues, your application demonstrates several positive qualities:

1. **Good Database Design**: Proper use of indexes, foreign keys, and cascade deletes
2. **Efficient Queries**: Good use of Prisma's query capabilities and raw SQL for complex queries
3. **Clean Component Structure**: Well-organized React components with proper separation of concerns
4. **Custom Hooks**: Good use of React hooks for reusable logic (useArtistHistory, useSpotifySearch)
5. **Proper Data Normalization**: Good handling of Spotify data with fallback IDs
6. **Batch Processing**: Efficient bulk insert operations in database code
7. **Loading States**: Good UX with loading indicators and skeleton screens

---

## Final Verdict

**Status: REQUEST CHANGES (Critical security issues must be fixed)**

This application has a solid architectural foundation but contains critical security vulnerabilities that make it unsuitable for production use in its current state. The hardcoded API credentials and exposed access tokens are **immediate blockers** that must be addressed.

### Priority Action Items:
1. **TODAY**: Rotate Spotify API credentials and move to environment variables
2. **THIS WEEK**: Implement proper token handling (cookies/headers), authorization checks, and rate limiting
3. **NEXT SPRINT**: Add CSRF protection, improve input validation, and implement security headers
4. **ONGOING**: Set up security linting, audit logging, and monitoring

Once the critical and high-priority security issues are resolved, this will be a well-architected application with good potential for production deployment.
