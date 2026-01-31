import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import {
  failJob,
  getJobById,
  updateJobMetrics,
} from '@/lib/db/importJob.js';
import { processImport } from '@/lib/import/processImport.js';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

export const POST = verifySignatureAppRouter(async (req) => {
  const { jobId } = await req.json();

  if (!jobId) {
    return NextResponse.json(
      { error: 'jobId is required' },
      { status: 400 }
    );
  }

  const job = await getJobById(jobId);

  if (!job) {
    return NextResponse.json(
      { error: 'Import job not found' },
      { status: 404 }
    );
  }

  if (job.status === 'processing' || job.status === 'completed') {
    return NextResponse.json({ success: true, status: job.status });
  }

  if (job.status === 'failed') {
    return NextResponse.json({ success: true, status: job.status });
  }

  const rawData = job.metrics?.rawData;
  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
    await failJob(jobId, 'Missing import payload');
    return NextResponse.json(
      { error: 'Missing import payload' },
      { status: 400 }
    );
  }

  await processImport(jobId.toString(), job.userId, rawData);

  await updateJobMetrics(jobId, { ...(job.metrics || {}), rawData: null });

  return NextResponse.json({ success: true });
});
