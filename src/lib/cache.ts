/**
 * Sistema de cache simples em memória para APIs e consultas.
 *
 * Mantém um Map de chaves para objetos { data, timestamp } e expira de acordo
 * com a duração definida por quem consome a função getCache.
 *
 * Observação: este cache é process-bound (não distribuído) e será reiniciado
 * a cada restart do servidor/processo. Adequado para pequenos ganhos de performance
 * e evitar chamadas repetidas imediatas.
 */
const cache = new Map<string, { data: any; timestamp: number }>();

export const CACHE_DURATION = {
  SHORT: 5000,    // 5 segundos
  MEDIUM: 30000,  // 30 segundos
  LONG: 60000,    // 1 minuto
};

/**
 * Obtém dados do cache se ainda estiverem dentro da janela de validade.
 *
 * @param key Chave utilizada para identificar a entrada de cache.
 * @param duration Tempo de vida (TTL) em milissegundos; padrão: CACHE_DURATION.SHORT.
 * @returns Dados cacheados ou null se expirado/inexistente.
 */
export const getCache = (key: string, duration: number = CACHE_DURATION.SHORT): any | null => {
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < duration) {
    // Cache hit - log silencioso
    return cached.data;
  }
  
  return null;
};

/**
 * Salva dados no cache com a chave fornecida, marcando o timestamp atual.
 *
 * @param key Chave única para a entrada de cache.
 * @param data Valor a ser armazenado.
 */
export const setCache = (key: string, data: any): void => {
  cache.set(key, { data, timestamp: Date.now() });
  // Log silencioso
};

/**
 * Remove uma entrada específica do cache.
 *
 * @param key Chave da entrada a ser removida.
 */
export const clearCache = (key: string): void => {
  cache.delete(key);
};

/**
 * Limpa entradas do cache cujas chaves incluem o padrão informado.
 * Útil após mutações que impactam grupos de dados (ex.: "products:" ou "orders:").
 *
 * @param pattern Substring para correspondência de chaves.
 */
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

/**
 * Limpa todas as entradas do cache em memória.
 * Deve ser usado com parcimônia, pois invalida tudo.
 */
export const clearAllCache = (): void => {
  const size = cache.size;
  cache.clear();
  if (size > 0 && process.env.ENABLE_CACHE_LOGS === 'true') {
    console.log(`🗑️ Cache completo limpo: ${size} entradas`);
  }
};

/**
 * Retorna estatísticas simples do cache atual.
 *
 * @returns Objeto com tamanho e lista de chaves.
 */
export const getCacheStats = () => {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
};

