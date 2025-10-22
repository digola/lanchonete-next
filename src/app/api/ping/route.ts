import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || 'pong';
  return NextResponse.json({ ok: true, pong: true, q });
}

export async function POST(req: NextRequest) {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch (_) {
    // Se não for JSON, tenta texto puro
    const text = await req.text();
    body = { raw: text };
  }
  return NextResponse.json({ ok: true, message: 'pong', received: body });
}