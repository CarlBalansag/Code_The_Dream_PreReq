import prisma from '../src/lib/prisma.js';
import { Prisma } from '@prisma/client';

async function testFavoriteTrack() {
  try {
    // Test parameters (Drake's artist ID from your logs)
    // Using CarlB's user ID - UPDATE THIS IF YOU'RE A DIFFERENT USER
    const userId = '31a7kjlfykjlyxfdq7cqa4ywsrgu';
    const artistId = '3TVXtAsR1Inumwj472S9r4'; // Drake
    const artistName = 'Drake';
    const startDate = new Date('2025-10-08T07:00:00.000Z');
    const endDate = new Date('2025-11-08T07:59:59.999Z');

    console.log('Testing favorite track query with params:', {
      userId,
      artistId,
      artistName,
      startDate,
      endDate,
    });

    // First, let's check if there are ANY plays for this artist
    const allPlays = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM plays p
      INNER JOIN tracks t ON t.id = p.track_id
      INNER JOIN artists ar ON ar.id = t.artist_id
      WHERE p.user_id = ${userId}
        AND p.played_at >= ${startDate}
        AND p.played_at <= ${endDate}
        AND (
          t.artist_id = ${artistId}
          OR LOWER(ar.name) = LOWER(${artistName})
        )
    `;
    console.log('\n✅ Total plays for this artist in date range:', allPlays);

    // Check tracks table
    const tracksForArtist = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM tracks t
      WHERE t.artist_id = ${artistId}
    `;
    console.log('✅ Tracks in database for artist ID:', tracksForArtist);

    // Check artists table
    const artistCheck = await prisma.$queryRaw`
      SELECT id, name
      FROM artists
      WHERE id = ${artistId} OR LOWER(name) = LOWER(${artistName})
    `;
    console.log('✅ Artist in database:', artistCheck);

    // Now run the actual favorite track query
    const rows = await prisma.$queryRaw`
      SELECT
        t.id AS track_id,
        t.name AS track_name,
        COUNT(*)::bigint AS play_count
      FROM plays p
      INNER JOIN tracks t ON t.id = p.track_id
      INNER JOIN artists ar ON ar.id = t.artist_id
      WHERE
        p.user_id = ${userId}
        ${startDate ? Prisma.sql`AND p.played_at >= ${startDate}` : Prisma.empty}
        ${endDate ? Prisma.sql`AND p.played_at <= ${endDate}` : Prisma.empty}
        AND t.name IS NOT NULL
        AND (
          ${artistId ? Prisma.sql`t.artist_id = ${artistId}` : Prisma.sql`FALSE`}
          OR ${artistName ? Prisma.sql`LOWER(ar.name) = LOWER(${artistName})` : Prisma.sql`FALSE`}
        )
      GROUP BY track_id, track_name
      ORDER BY play_count DESC
      LIMIT 5;
    `;

    console.log('\n✅ Top 5 favorite tracks:', rows);

    if (rows.length > 0) {
      console.log('\n✅ Favorite track found:');
      console.log({
        trackId: rows[0].track_id,
        trackName: rows[0].track_name,
        playCount: Number(rows[0].play_count),
      });
    } else {
      console.log('\n⚠️ No favorite track found');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFavoriteTrack();
