import { NextResponse } from "next/server";
import {
  updateBackgroundTracking,
  getBackgroundTrackingStatus,
} from "@/lib/db/index.js";

// GET - Get current background tracking status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    const enabled = await getBackgroundTrackingStatus(userId);

    return NextResponse.json({ enabled });
  } catch (error) {
    console.error("Error getting background tracking status:", error);
    return NextResponse.json(
      { error: "Failed to get background tracking status" },
      { status: 500 }
    );
  }
}

// POST - Update background tracking setting
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, enabled } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId in request body" },
        { status: 400 }
      );
    }

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "enabled must be a boolean" },
        { status: 400 }
      );
    }

    const user = await updateBackgroundTracking(userId, enabled);

    return NextResponse.json({
      success: true,
      enabled: user.backgroundTracking,
    });
  } catch (error) {
    console.error("Error updating background tracking:", error);
    return NextResponse.json(
      { error: "Failed to update background tracking" },
      { status: 500 }
    );
  }
}
