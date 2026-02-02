import {
  failJob,
  getJobById,
  updateJobMetrics,
} from '@/lib/db/importJob.js';
import { processImport } from '@/lib/import/processImport.js';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req) {
  try {
    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId is required' },
        { status: 400 }
      );
    }

    console.log(`📥 Processing import job: ${jobId}`);

    const job = await getJobById(jobId);

    if (!job) {
      console.log(`❌ Job not found: ${jobId}`);
      return NextResponse.json(
        { error: 'Import job not found' },
        { status: 404 }
      );
    }

    if (job.status === 'processing' || job.status === 'completed') {
      console.log(`⏭️ Job already ${job.status}: ${jobId}`);
      return NextResponse.json({ success: true, status: job.status });
    }

    if (job.status === 'failed') {
      console.log(`⏭️ Job already failed: ${jobId}`);
      return NextResponse.json({ success: true, status: job.status });
    }

    const rawData = job.metrics?.rawData;
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      console.log(`❌ Missing payload for job: ${jobId}`);
      await failJob(jobId, 'Missing import payload');
      return NextResponse.json(
        { error: 'Missing import payload' },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting import for job ${jobId} with ${rawData.length} tracks`);
    await processImport(jobId.toString(), job.userId, rawData);

    await updateJobMetrics(jobId, { ...(job.metrics || {}), rawData: null });

    console.log(`✅ Import complete for job: ${jobId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Process route error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
