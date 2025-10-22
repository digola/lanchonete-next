import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    nodeVersion: process.version,
    env: process.env.NODE_ENV || 'development',
  });
}