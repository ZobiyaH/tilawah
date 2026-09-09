import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const version = process.env.VERCEL_GIT_COMMIT_SHA || process.env.BUILD_ID || "v_1.0.9";
  return NextResponse.json(
    { version, timestamp: Date.now() },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}
