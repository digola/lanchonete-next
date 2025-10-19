import type { NextRequest } from 'next/server';

// Simple in-memory fixed window rate limiter (per process)
// Not suitable for multi-instance deployments without a shared store.

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
};

export function getClientIp(req: NextRequest): string {
  const h = req.headers;
  const list = h.get('x-forwarded-for');
  if (typeof list === 'string' && list.length > 0) {
    const first = list.split(',')[0];
    return typeof first === 'string' ? first.trim() : 'unknown';
  }
  return (
    h.get('x-real-ip') ??
    h.get('cf-connecting-ip') ??
    h.get('x-client-ip') ??
    'unknown'
  );
}

export function checkRateLimit(key: string, windowMs: number, max: number): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || now >= existing.resetAt) {
    // start new window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: Math.max(0, max - 1), resetInMs: windowMs };
  }

  const nextCount = existing.count + 1;
  const allowed = nextCount <= max;
  const remaining = Math.max(0, max - nextCount);
  const resetInMs = Math.max(0, existing.resetAt - now);

  store.set(key, { count: nextCount, resetAt: existing.resetAt });

  return { allowed, remaining, resetInMs };
}