import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  // tenta verificar conexão com o banco
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', db: 'ok' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'degraded', db: 'fail', error: error?.message || 'DB error' },
      { status: 503 }
    );
  }
}