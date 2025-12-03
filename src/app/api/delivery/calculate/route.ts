import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

function computeFee(distanceMeters: number) {
  const km = distanceMeters / 1000;
  const base = 5;
  const perKm = 2;
  const fee = Math.max(base, base + Math.max(0, km - 1) * perKm);
  return Number(fee.toFixed(2));
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API key não configurada' }, { status: 500 });
    }

    const body = await request.json();
    const origin = String(body?.origin || '').trim();
    const destination = String(body?.destination || '').trim();

    if (!origin || !destination) {
      return NextResponse.json({ success: false, error: 'Origem e destino são obrigatórios' }, { status: 400 });
    }

    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    url.searchParams.set('origins', origin);
    url.searchParams.set('destinations', destination);
    url.searchParams.set('units', 'metric');
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString());
    const json = await res.json();

    const element = json?.rows?.[0]?.elements?.[0];
    const status = element?.status || json?.status;
    if (!element || status !== 'OK') {
      return NextResponse.json({ success: false, error: 'Não foi possível calcular a distância', details: json }, { status: 400 });
    }

    const distanceMeters = Number(element.distance?.value || 0);
    const durationSeconds = Number(element.duration?.value || 0);
    const fee = computeFee(distanceMeters);

    return NextResponse.json({ success: true, data: { distanceMeters, durationSeconds, fee } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Erro interno do servidor', details: error?.message }, { status: 500 });
  }
}

