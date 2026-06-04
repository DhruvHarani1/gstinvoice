import { NextResponse } from 'next/server';

export const runtime = 'edge'; // Optional: Use edge runtime for fast response times

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: Date.now(),
  });
}
