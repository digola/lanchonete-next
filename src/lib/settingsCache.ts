// Cache em memória para configurações públicas (5 minutos)
// Reduz drasticamente o número de queries ao banco

interface CachedSettings {
  restaurantName: string;
  restaurantAddress: string;
  restaurantPhone: string;
  restaurantEmail: string;
  openingTime: string;
  closingTime: string;
  workingDays: string[];
  currency: string;
  language: string;
  timezone: string;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

let cachedSettings: CachedSettings | null = null;
let cacheExpiry = 0;

export function setCachedSettings(settings: CachedSettings): void {
  cachedSettings = settings;
  cacheExpiry = Date.now() + CACHE_DURATION;
  console.log('✅ Settings armazenados em cache (TTL: 5min)');
}

export function getCachedSettings(): CachedSettings | null {
  const now = Date.now();
  
  if (cachedSettings && now < cacheExpiry) {
    console.log('✅ Cache hit - Settings devolvidos do cache');
    return cachedSettings;
  }
  
  console.log('⏰ Cache miss - Será necessário buscar do banco');
  cachedSettings = null;
  cacheExpiry = 0;
  return null;
}

export function invalidateSettingsCache(): void {
  cachedSettings = null;
  cacheExpiry = 0;
  console.log('🔄 Cache de Settings invalidado');
}

export function getCacheStatus(): {
  isCached: boolean;
  expiresIn: number;
  hasExpired: boolean;
} {
  const now = Date.now();
  const hasData = cachedSettings !== null;
  const hasExpired = now >= cacheExpiry;
  
  return {
    isCached: hasData && !hasExpired,
    expiresIn: Math.max(0, cacheExpiry - now),
    hasExpired,
  };
}
