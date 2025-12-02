import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCachedSettings, setCachedSettings, getCacheStatus } from '@/lib/settingsCache';
// Nota: Mantemos o formato retornado compatível com o hook usePublicSettings
// (restaurantName, restaurantAddress, restaurantPhone, restaurantEmail,
// openingTime, closingTime, workingDays, currency, language),
// e incluímos timezone como campo extra opcional.

export const runtime = 'nodejs';

const DEFAULT_PUBLIC_SETTINGS = {
  restaurantName: 'Lanchonete',
  restaurantAddress: 'Endereço não informado',
  restaurantPhone: '(11) 99999-9999',
  restaurantEmail: 'contato@lanchonete.com',
  openingTime: '08:00',
  closingTime: '22:00',
  workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  currency: 'BRL',
  language: 'pt-BR',
  timezone: 'America/Sao_Paulo',
};

// Constrói objeto AppConfig a partir das linhas da tabela Settings (categoria 'general')
function buildPublicSettings(rows: Array<{ key: string; value: string }>) {
  const obj: Record<string, any> = {};
  for (const row of rows) {
    try {
      obj[row.key] = JSON.parse(row.value);
    } catch {
      obj[row.key] = row.value;
    }
  }

  return {
    restaurantName: obj.restaurantName ?? DEFAULT_PUBLIC_SETTINGS.restaurantName,
    restaurantAddress: obj.restaurantAddress ?? DEFAULT_PUBLIC_SETTINGS.restaurantAddress,
    restaurantPhone: obj.restaurantPhone ?? DEFAULT_PUBLIC_SETTINGS.restaurantPhone,
    restaurantEmail: obj.restaurantEmail ?? DEFAULT_PUBLIC_SETTINGS.restaurantEmail,
    openingTime: obj.openingTime ?? DEFAULT_PUBLIC_SETTINGS.openingTime,
    closingTime: obj.closingTime ?? DEFAULT_PUBLIC_SETTINGS.closingTime,
    workingDays: Array.isArray(obj.workingDays) ? obj.workingDays : DEFAULT_PUBLIC_SETTINGS.workingDays,
    currency: obj.currency ?? DEFAULT_PUBLIC_SETTINGS.currency,
    language: obj.language ?? DEFAULT_PUBLIC_SETTINGS.language,
    timezone: obj.timezone ?? DEFAULT_PUBLIC_SETTINGS.timezone,
  };
}

export async function GET() {
  try {
    // 1️⃣ Verificar cache primeiro
    const cacheStatus = getCacheStatus();
    const cachedSettings = getCachedSettings();
    
    if (cachedSettings) {
      return NextResponse.json({ 
        success: true, 
        data: cachedSettings,
        _cache: 'HIT'
      });
    }

    // 2️⃣ Se não está em cache, buscar do banco
    const settingsModel = (prisma as any).settings;
    if (settingsModel && settingsModel.findMany) {
      const rows = await settingsModel.findMany({
        where: { isActive: true, category: 'general' },
        orderBy: { key: 'asc' },
        select: { key: true, value: true },
      });
      
      if (rows && rows.length) {
        const publicSettings = buildPublicSettings(rows);
        
        // 3️⃣ Armazenar em cache
        setCachedSettings(publicSettings);
        
        return NextResponse.json({ 
          success: true, 
          data: publicSettings,
          _cache: 'MISS'
        });
      }
    }
  } catch (err) {
    console.error('❌ Erro ao buscar configurações públicas:', err);
  }

  // Fallback: retorna defaults
  return NextResponse.json({ 
    success: true, 
    data: DEFAULT_PUBLIC_SETTINGS,
    _cache: 'FALLBACK'
  });
}