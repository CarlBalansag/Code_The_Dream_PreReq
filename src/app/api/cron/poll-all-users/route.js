import { NextResponse } from "next/server";
import { getUsersWithBackgroundTracking } from "@/lib/db/index.js";
import { pollRecentlyPlayed } from "@/lib/services/continuousPolling.js";

// Vercel Cron sends this header to verify the request is from Vercel
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request) {
  // Only run in production
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.json({
      skipped: true,
      reason: "Not production environment",
    });
  }

  // Verify the request is from Vercel Cron (if CRON_SECRET is set)
  if (CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    console.log("🕐 Cron job started: polling all users with background tracking enabled");

    // Get users who have background tracking enabled and have valid refresh tokens
    const users = await getUsersWithBackgroundTracking(50);

    if (users.length === 0) {
      console.log("No users with background tracking enabled");
      return NextResponse.json({
        success: true,
        message: "No users to poll",
        usersPolled: 0,
        totalNewPlays: 0,
      });
    }

    console.log(`Found ${users.length} users to poll`);

    const results = {
      success: [],
      failed: [],
      totalNewPlays: 0,
    };

    // Poll each user sequentially to avoid rate limits
    for (const user of users) {
      try {
        const result = await pollRecentlyPlayed(user.spotifyId);
        results.success.push({
          userId: user.spotifyId,
          displayName: user.displayName,
          newPlays: result.newPlays,
        });
        results.totalNewPlays += result.newPlays;
      } catch (error) {
        console.error(`Failed to poll user ${user.spotifyId}:`, error.message);
        results.failed.push({
          userId: user.spotifyId,
          displayName: user.displayName,
          error: error.message,
        });
      }

      // Small delay between users to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`✅ Cron job complete: ${results.success.length} succeeded, ${results.failed.length} failed, ${results.totalNewPlays} new plays`);

    return NextResponse.json({
      success: true,
      usersPolled: results.success.length,
      usersFailed: results.failed.length,
      totalNewPlays: results.totalNewPlays,
      details: {
        succeeded: results.success,
        failed: results.failed,
      },
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      { error: "Cron job failed", message: error.message },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering (with same auth)
export async function POST(request) {
  return GET(request);
}
