import prisma from "../prisma.js";

const IMPORT_FLAGS = {
  INITIAL: 1,
  FULL: 2,
};

function applyFlag(flags, flag) {
  return (flags || 0) | flag;
}

function parseImportStatus(flags = 0) {
  return {
    hasInitialImport: Boolean(flags & IMPORT_FLAGS.INITIAL),
    hasFullImport: Boolean(flags & IMPORT_FLAGS.FULL),
  };
}

function mapUser(record, { includeTokens = true } = {}) {
  if (!record) {
    return null;
  }

  const status = parseImportStatus(record.import_flags);

  const user = {
    spotifyId: record.spotify_id,
    displayName: record.display_name,
    email: record.email,
    country: record.country,
    profileImage: record.profile_image,
    spotifyAccessToken: includeTokens ? record.access_token : undefined,
    spotifyRefreshToken: includeTokens ? record.refresh_token : undefined,
    tokenExpiresAt: record.token_expires_at,
    backgroundTracking: record.background_tracking ?? true,
    lastCheckTimestamp: record.last_check_at,
    joinedAt: record.joined_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    ...status,
  };

  if (!includeTokens) {
    delete user.spotifyAccessToken;
    delete user.spotifyRefreshToken;
  }

  return user;
}

export async function saveUser(userData) {
  const now = new Date();
  const normalizedEmail = userData.email ? userData.email.toLowerCase() : null;

  const user = await prisma.users.upsert({
    where: { spotify_id: userData.spotifyId },
    update: {
      display_name: userData.displayName,
      email: normalizedEmail,
      country: userData.country,
      profile_image: userData.profileImage,
      access_token: userData.spotifyAccessToken,
      refresh_token: userData.spotifyRefreshToken,
      token_expires_at: userData.tokenExpiresAt,
      updated_at: now,
    },
    create: {
      spotify_id: userData.spotifyId,
      display_name: userData.displayName,
      email: normalizedEmail,
      country: userData.country,
      profile_image: userData.profileImage,
      access_token: userData.spotifyAccessToken,
      refresh_token: userData.spotifyRefreshToken,
      token_expires_at: userData.tokenExpiresAt,
      import_flags: 0,
      last_check_at: null,
      joined_at: userData.joinedAt || now,
      created_at: now,
      updated_at: now,
    },
  });

  return mapUser(user);
}

export async function getUserBySpotifyId(spotifyId, options = {}) {
  const user = await prisma.users.findUnique({
    where: { spotify_id: spotifyId },
  });
  return mapUser(user, options);
}

export async function getUserByEmail(email, options = {}) {
  if (!email) return null;
  const user = await prisma.users.findFirst({
    where: { email: email.toLowerCase() },
  });
  return mapUser(user, options);
}

export async function updateUserTokens(spotifyId, { accessToken, refreshToken, expiresAt }) {
  const updateData = {
    access_token: accessToken,
    token_expires_at: expiresAt,
    updated_at: new Date(),
  };

  if (refreshToken) {
    updateData.refresh_token = refreshToken;
  }

  const user = await prisma.users.update({
    where: { spotify_id: spotifyId },
    data: updateData,
  });

  return mapUser(user);
}

export async function updateLastCheckTimestamp(spotifyId, timestamp = new Date()) {
  const user = await prisma.users.update({
    where: { spotify_id: spotifyId },
    data: { last_check_at: timestamp, updated_at: new Date() },
  });
  return mapUser(user);
}

export async function markInitialImportComplete(spotifyId) {
  const existing = await prisma.users.findUnique({
    where: { spotify_id: spotifyId },
    select: { import_flags: true },
  });

  if (!existing) {
    throw new Error(`User not found: ${spotifyId}`);
  }

  const updated = await prisma.users.update({
    where: { spotify_id: spotifyId },
    data: { import_flags: applyFlag(existing.import_flags, IMPORT_FLAGS.INITIAL) },
  });

  return mapUser(updated);
}

export async function markFullImportComplete(spotifyId) {
  const existing = await prisma.users.findUnique({
    where: { spotify_id: spotifyId },
    select: { import_flags: true },
  });

  if (!existing) {
    throw new Error(`User not found: ${spotifyId}`);
  }

  let nextFlags = applyFlag(existing.import_flags, IMPORT_FLAGS.FULL);
  nextFlags = applyFlag(nextFlags, IMPORT_FLAGS.INITIAL);

  const updated = await prisma.users.update({
    where: { spotify_id: spotifyId },
    data: { import_flags: nextFlags },
  });

  return mapUser(updated);
}

export async function getAllUsers(limit = 100) {
  const users = await prisma.users.findMany({
    orderBy: { joined_at: "desc" },
    take: limit,
  });

  return users.map((user) => mapUser(user, { includeTokens: false }));
}

export async function deleteUser(spotifyId) {
  const user = await prisma.users.delete({
    where: { spotify_id: spotifyId },
  });

  return mapUser(user);
}

export async function getUserStats() {
  const totalUsers = await prisma.users.count();

  const usersWithInitialImport = await prisma.users.count({
    where: { import_flags: { in: [IMPORT_FLAGS.INITIAL, IMPORT_FLAGS.INITIAL + IMPORT_FLAGS.FULL] } },
  });

  const usersWithFullImport = await prisma.users.count({
    where: { import_flags: { in: [IMPORT_FLAGS.FULL, IMPORT_FLAGS.INITIAL + IMPORT_FLAGS.FULL] } },
  });

  return {
    totalUsers,
    usersWithInitialImport,
    usersWithFullImport,
  };
}

export function needsInitialImport(user) {
  if (!user) return false;
  return !user.hasInitialImport;
}

export async function updateBackgroundTracking(spotifyId, enabled) {
  const user = await prisma.users.update({
    where: { spotify_id: spotifyId },
    data: {
      background_tracking: enabled,
      updated_at: new Date()
    },
  });
  return mapUser(user);
}

export async function getBackgroundTrackingStatus(spotifyId) {
  const user = await prisma.users.findUnique({
    where: { spotify_id: spotifyId },
    select: { background_tracking: true },
  });
  return user?.background_tracking ?? true;
}

export async function getUsersWithBackgroundTracking(limit = 100) {
  const users = await prisma.users.findMany({
    where: {
      background_tracking: true,
      refresh_token: { not: null },
    },
    orderBy: { last_check_at: "asc" },
    take: limit,
  });

  return users.map((user) => mapUser(user));
}
