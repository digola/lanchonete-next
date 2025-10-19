import { NextResponse } from 'next/server';

export async function GET() {
  const keys = [
    'DATABASE_URL',
    'DIRECT_URL',
    'POSTGRES_PRISMA_URL',
    'POSTGRES_URL',
    'SUPABASE_DB_URL',
    'APP_URL',
    'NEXTAUTH_URL',
    'UPLOAD_BASE_URL'
  ];
  const env: Record<string, string | undefined> = {};
  for (const k of keys) env[k] = process.env[k];
  return NextResponse.json({ env }, { status: 200 });
}