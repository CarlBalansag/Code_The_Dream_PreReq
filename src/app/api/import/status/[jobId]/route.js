<<<<<<< HEAD
import { connectToDB } from '@/lib/mongodb.js';
import { ImportJob } from '@/lib/models/ImportJob.js';
=======
import { getJobById } from '@/lib/db/importJob.js';
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
import { NextResponse } from 'next/server';

/**
 * GET /api/import/status/[jobId]
 * Check the status of an import job
 *
 * Returns job status, progress, and statistics
 */
export async function GET(req, { params }) {
  try {
<<<<<<< HEAD
    await connectToDB();

=======
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId is required' },
        { status: 400 }
      );
    }

<<<<<<< HEAD
    // Get job
    const job = await ImportJob.getJobById(jobId);
=======
    const job = await getJobById(jobId);
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600

    if (!job) {
      return NextResponse.json(
        { error: 'Import job not found' },
        { status: 404 }
      );
    }

<<<<<<< HEAD
    // Calculate progress
    const percentComplete = job.getProgress();
=======
    const percentComplete = job.totalTracks
      ? Math.round((job.processedTracks / job.totalTracks) * 100)
      : 0;
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600

    // Estimate time remaining (very rough estimate)
    let estimatedTimeRemaining = null;
    if (job.status === 'processing' && job.startedAt) {
      const elapsed = Date.now() - job.startedAt.getTime();
      const remainingTracks = job.totalTracks - job.processedTracks;

      if (job.processedTracks > 0) {
        const timePerTrack = elapsed / job.processedTracks;
        const remainingMs = remainingTracks * timePerTrack;

        // Convert to human-readable format
        const remainingMinutes = Math.ceil(remainingMs / 1000 / 60);

        if (remainingMinutes < 1) {
          estimatedTimeRemaining = 'Less than a minute';
        } else if (remainingMinutes === 1) {
          estimatedTimeRemaining = '1 minute';
        } else {
          estimatedTimeRemaining = `${remainingMinutes} minutes`;
        }
      }
    }

    // Return status
    return NextResponse.json({
<<<<<<< HEAD
      jobId: job._id.toString(),
=======
      jobId: job.id.toString(),
>>>>>>> 87ca31fd224237bbda80dffc127f5438735a0600
      userId: job.userId,
      status: job.status,
      fileName: job.fileName,
      totalTracks: job.totalTracks,
      processedTracks: job.processedTracks,
      percentComplete,
      estimatedTimeRemaining,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    });

  } catch (error) {
    console.error('❌ Status check error:', error);
    return NextResponse.json(
      {
        error: error.message,
        message: 'Failed to get import status'
      },
      { status: 500 }
    );
  }
}
