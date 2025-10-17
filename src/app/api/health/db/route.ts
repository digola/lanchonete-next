import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/src/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const status = await checkDatabaseHealth();
    return NextResponse.json({ ok: status.healthy, message: status.message });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message || 'Database error' }, { status: 500 });
  }
}