import mongoose from "mongoose";

/**
 * User Schema
 * Stores user accounts and Spotify authentication tokens
 */
const userSchema = new mongoose.Schema(
  {
    // Spotify's unique user ID - THIS IS THE KEY!
    spotifyId: {
      type: String,
      required: true,
      unique: true,
    },

    // User profile information
    displayName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: false, // Some Spotify users may not have email
      lowercase: true,
      trim: true,
    },

    country: {
      type: String,
      required: false,
    },

    profileImage: {
      type: String,
      required: false,
    },

    // Spotify API tokens (encrypted in production!)
    spotifyAccessToken: {
      type: String,
      required: false,
    },

    spotifyRefreshToken: {
      type: String,
      required: false,
    },

    tokenExpiresAt: {
      type: Date,
      required: false,
    },

    // Import tracking
    hasInitialImport: {
      type: Boolean,
      default: false,
      index: true,
    },

    hasFullImport: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Last time we checked Spotify for new plays
    lastCheckTimestamp: {
      type: Date,
      required: false,
    },

    // Account creation date
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    collection: "users",
  }
);

// Indexes for performance
// Note: spotifyId index is automatically created by unique: true above
userSchema.index({ email: 1 }); // Lookup by email
userSchema.index({ hasInitialImport: 1, hasFullImport: 1 }); // Filter by import status

// Instance method to check if token is expired
userSchema.methods.isTokenExpired = function () {
  if (!this.tokenExpiresAt) return true;
  return new Date() >= this.tokenExpiresAt;
};

// Instance method to check if token needs refresh (expires in < 5 minutes)
userSchema.methods.needsTokenRefresh = function () {
  if (!this.tokenExpiresAt) return true;
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  return this.tokenExpiresAt <= fiveMinutesFromNow;
};

// Static method to find user by Spotify ID
userSchema.statics.findBySpotifyId = function (spotifyId) {
  return this.findOne({ spotifyId });
};

// Static method to find user by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Prevent model recompilation in development (Next.js hot reload)
export const User =
  mongoose.models.User || mongoose.model("User", userSchema);
