import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const payload = await verifyToken(authHeader.replace('Bearer ', ''));
  if (!payload) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ ok: true, user: payload });
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const payload = await verifyToken(authHeader.replace('Bearer ', ''));
  const body = await req.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ ok: true, user: payload, received: body });
}