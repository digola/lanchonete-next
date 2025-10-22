import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const query = Object.fromEntries(req.nextUrl.searchParams.entries());
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => (headers[key] = value));
  return NextResponse.json({ ok: true, method: 'GET', query, headers });
}

export async function POST(req: NextRequest) {
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => (headers[key] = value));

  const raw = await req.text();
  let json: unknown = null;
  try {
    json = JSON.parse(raw);
  } catch (_) {
    // não é JSON, mantém raw
  }

  return NextResponse.json({ ok: true, method: 'POST', headers, bodyRaw: raw, bodyJson: json });
}