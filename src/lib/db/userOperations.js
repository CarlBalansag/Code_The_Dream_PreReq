import { User } from "../models/User.js";
import { connectToDB } from "../mongodb.js";

/**
 * User Database Operations
 * All functions for managing users in the database
 */

/**
 * Create a new user or update existing user (upsert)
 * Called after Spotify OAuth login
 */
export async function saveUser(userData) {
  await connectToDB();

  const {
    spotifyId,
    displayName,
    email,
    country,
    profileImage,
    spotifyAccessToken,
    spotifyRefreshToken,
    tokenExpiresAt,
  } = userData;

  try {
    // Find existing user or create new one
    const user = await User.findOneAndUpdate(
      { spotifyId },
      {
        $set: {
          displayName,
          email,
          country,
          profileImage,
          spotifyAccessToken,
          spotifyRefreshToken,
          tokenExpiresAt,
        },
        $setOnInsert: {
          joinedAt: new Date(),
          hasInitialImport: false,
          hasFullImport: false,
        },
      },
      {
        upsert: true, // Create if doesn't exist
        new: true, // Return updated document
        runValidators: true,
      }
    );

    console.log(`✅ User saved: ${displayName} (${spotifyId})`);
    return user;
  } catch (error) {
    console.error("❌ Error saving user:", error.message);
    throw error;
  }
}

/**
 * Get user by Spotify ID
 */
export async function getUserBySpotifyId(spotifyId) {
  await connectToDB();

  try {
    const user = await User.findBySpotifyId(spotifyId);
    return user;
  } catch (error) {
    console.error("❌ Error getting user:", error.message);
    throw error;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email) {
  await connectToDB();

  try {
    const user = await User.findByEmail(email);
    return user;
  } catch (error) {
    console.error("❌ Error getting user by email:", error.message);
    throw error;
  }
}

/**
 * Update user's Spotify tokens
 * Called when refreshing access token
 */
export async function updateUserTokens(
  spotifyId,
  { accessToken, refreshToken, expiresAt }
) {
  await connectToDB();

  try {
    const updateData = {
      spotifyAccessToken: accessToken,
      tokenExpiresAt: expiresAt,
    };

    // Only update refresh token if provided (it may not change)
    if (refreshToken) {
      updateData.spotifyRefreshToken = refreshToken;
    }

    const user = await User.findOneAndUpdate(
      { spotifyId },
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      throw new Error(`User not found: ${spotifyId}`);
    }

    console.log(`✅ Tokens updated for user: ${user.displayName}`);
    return user;
  } catch (error) {
    console.error("❌ Error updating tokens:", error.message);
    throw error;
  }
}

/**
 * Update user's last check timestamp
 * Called after polling Spotify for new plays
 */
export async function updateLastCheckTimestamp(spotifyId, timestamp = null) {
  await connectToDB();

  try {
    const user = await User.findOneAndUpdate(
      { spotifyId },
      { $set: { lastCheckTimestamp: timestamp || new Date() } },
      { new: true }
    );

    if (!user) {
      throw new Error(`User not found: ${spotifyId}`);
    }

    return user;
  } catch (error) {
    console.error("❌ Error updating last check timestamp:", error.message);
    throw error;
  }
}

/**
 * Mark user's initial import as complete
 * Called after importing recent 50 tracks
 */
export async function markInitialImportComplete(spotifyId) {
  await connectToDB();

  try {
    const user = await User.findOneAndUpdate(
      { spotifyId },
      { $set: { hasInitialImport: true } },
      { new: true }
    );

    if (!user) {
      throw new Error(`User not found: ${spotifyId}`);
    }

    console.log(`✅ Initial import marked complete for: ${user.displayName}`);
    return user;
  } catch (error) {
    console.error("❌ Error marking initial import:", error.message);
    throw error;
  }
}

/**
 * Mark user's full history import as complete
 * Called after importing full Spotify history from ZIP
 */
export async function markFullImportComplete(spotifyId) {
  await connectToDB();

  try {
    const user = await User.findOneAndUpdate(
      { spotifyId },
      { $set: { hasFullImport: true } },
      { new: true }
    );

    if (!user) {
      throw new Error(`User not found: ${spotifyId}`);
    }

    console.log(`✅ Full import marked complete for: ${user.displayName}`);
    return user;
  } catch (error) {
    console.error("❌ Error marking full import:", error.message);
    throw error;
  }
}

/**
 * Get all users (admin function)
 */
export async function getAllUsers(limit = 100) {
  await connectToDB();

  try {
    const users = await User.find({})
      .select("-spotifyAccessToken -spotifyRefreshToken") // Hide sensitive data
      .sort({ joinedAt: -1 })
      .limit(limit);

    return users;
  } catch (error) {
    console.error("❌ Error getting all users:", error.message);
    throw error;
  }
}

/**
 * Delete user and all their data
 * WARNING: This should also delete all plays and import jobs
 */
export async function deleteUser(spotifyId) {
  await connectToDB();

  try {
    const user = await User.findOneAndDelete({ spotifyId });

    if (!user) {
      throw new Error(`User not found: ${spotifyId}`);
    }

    console.log(`✅ User deleted: ${user.displayName}`);
    return user;
  } catch (error) {
    console.error("❌ Error deleting user:", error.message);
    throw error;
  }
}

/**
 * Get user statistics
 */
export async function getUserStats() {
  await connectToDB();

  try {
    const totalUsers = await User.countDocuments();
    const usersWithInitialImport = await User.countDocuments({
      hasInitialImport: true,
    });
    const usersWithFullImport = await User.countDocuments({
      hasFullImport: true,
    });

    return {
      totalUsers,
      usersWithInitialImport,
      usersWithFullImport,
    };
  } catch (error) {
    console.error("❌ Error getting user stats:", error.message);
    throw error;
  }
}
