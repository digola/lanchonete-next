import { NextRequest, NextResponse } from 'next/server';
import { generateTokenPair } from '@/lib/auth';
import { UserRole, User } from '@/types';

function randomId() {
  return 'mock-' + Math.random().toString(36).slice(2, 10);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));
  const email: string = body?.email || 'admin@example.com';
  const name: string = body?.name || 'Mock Admin';
  const roleInput: string | undefined = body?.role;
  const role: UserRole = (Object.values(UserRole) as string[]).includes(roleInput || '')
    ? (roleInput as UserRole)
    : UserRole.ADMIN;

  const now = new Date();
  const user: User = {
    id: randomId(),
    email,
    name,
    role,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  const tokens = generateTokenPair(user);
  return NextResponse.json({ ok: true, user, ...tokens });
}

export async function GET() {
  // Retorna um token rápido para ADMIN, útil para teste sem body
  const now = new Date();
  const user: User = {
    id: randomId(),
    email: 'admin@example.com',
    name: 'Mock Admin',
    role: UserRole.ADMIN,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  const tokens = generateTokenPair(user);
  return NextResponse.json({ ok: true, user, ...tokens });
}