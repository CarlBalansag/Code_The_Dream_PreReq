import prisma from "../prisma.js";

function mapJob(record) {
  if (!record) return null;

  return {
    id: record.id,
    userId: record.user_id,
    status: record.status,
    fileName: record.file_name,
    totalTracks: record.total_tracks,
    processedTracks: record.processed_tracks,
    startedAt: record.started_at,
    completedAt: record.completed_at,
    errorMessage: record.error_message,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    metrics: record.metrics,
  };
}

export async function createJob(userId, fileName, totalTracks) {
  const job = await prisma.import_jobs.create({
    data: {
      user_id: userId,
      file_name: fileName,
      total_tracks: totalTracks,
      processed_tracks: 0,
      status: "pending",
    },
  });

  return mapJob(job);
}

export async function getJobById(jobId) {
  const numericId = Number(jobId);
  if (Number.isNaN(numericId)) {
    return null;
  }

  const job = await prisma.import_jobs.findUnique({
    where: { id: numericId },
  });

  return mapJob(job);
}

export async function getActiveJob(userId) {
  const job = await prisma.import_jobs.findFirst({
    where: {
      user_id: userId,
      status: { in: ["pending", "processing"] },
    },
    orderBy: { created_at: "desc" },
  });
  return mapJob(job);
}

export async function getUserJobs(userId, limit = 10) {
  const jobs = await prisma.import_jobs.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    take: limit,
  });
  return jobs.map(mapJob);
}

export async function markJobStarted(jobId) {
  const job = await prisma.import_jobs.update({
    where: { id: Number(jobId) },
    data: {
      status: "processing",
      started_at: new Date(),
      updated_at: new Date(),
    },
  });
  return mapJob(job);
}

export async function updateJobProgress(jobId, processedTracks) {
  const job = await prisma.import_jobs.update({
    where: { id: Number(jobId) },
    data: {
      processed_tracks: processedTracks,
      updated_at: new Date(),
    },
  });
  return mapJob(job);
}

export async function completeJob(jobId) {
  const existing = await prisma.import_jobs.findUnique({
    where: { id: Number(jobId) },
    select: { total_tracks: true },
  });

  if (!existing) {
    throw new Error("Import job not found");
  }

  const job = await prisma.import_jobs.update({
    where: { id: Number(jobId) },
    data: {
      status: "completed",
      completed_at: new Date(),
      processed_tracks: existing.total_tracks,
      updated_at: new Date(),
    },
  });
  return mapJob(job);
}

export async function failJob(jobId, errorMessage) {
  const job = await prisma.import_jobs.update({
    where: { id: Number(jobId) },
    data: {
      status: "failed",
      completed_at: new Date(),
      error_message: errorMessage,
      updated_at: new Date(),
    },
  });
  return mapJob(job);
}

export async function cleanupOldJobs(userId, keep = 5) {
  const jobs = await prisma.import_jobs.findMany({
    where: {
      user_id: userId,
      status: { in: ["completed", "failed"] },
    },
    orderBy: { completed_at: "desc" },
    skip: keep,
  });

  if (!jobs.length) {
    return 0;
  }

  const idsToDelete = jobs.map((job) => job.id);
  await prisma.import_jobs.deleteMany({
    where: { id: { in: idsToDelete } },
  });

  return idsToDelete.length;
}
