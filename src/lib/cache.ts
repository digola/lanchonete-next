// Sistema de cache simples em memória para APIs
const cache = new Map<string, { data: any; timestamp: number }>();

export const CACHE_DURATION = {
  SHORT: 5000,    // 5 segundos
  MEDIUM: 30000,  // 30 segundos
  LONG: 60000,    // 1 minuto
};

// Obter dados do cache
export const getCache = (key: string, duration: number = CACHE_DURATION.SHORT): any | null => {
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < duration) {
    // Cache hit - log silencioso
    return cached.data;
  }
  
  return null;
};

// Salvar no cache
export const setCache = (key: string, data: any): void => {
  cache.set(key, { data, timestamp: Date.now() });
  // Log silencioso
};

// Limpar cache específico
export const clearCache = (key: string): void => {
  cache.delete(key);
};

// Limpar cache por padrão (regex)
export const clearCachePattern = (pattern: string): void => {
  let cleared = 0;
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
      cleared++;
    }
  }
  // Log apenas se limpou algo
  if (cleared > 0 && process.env.ENABLE_CACHE_LOGS === 'true') {
    console.log(`🗑️ Cache invalidado: ${cleared} entradas`);
  }
};

// Limpar todo o cache
export const clearAllCache = (): void => {
  const size = cache.size;
  cache.clear();
  if (size > 0 && process.env.ENABLE_CACHE_LOGS === 'true') {
    console.log(`🗑️ Cache completo limpo: ${size} entradas`);
  }
};

// Obter estatísticas do cache
export const getCacheStats = () => {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
};

