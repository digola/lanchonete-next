/**
 * Otimizador de queries para melhorar performance.
 *
 * Fornece um cache interno em memória com TTL por chave, evitando execuções
 * repetidas de funções assíncronas (ex.: consultas ao banco) quando o resultado
 * recente ainda é válido. Inclui utilitários para decorar funções e criar
 * versões otimizadas de queries específicas.
 */

interface QueryCache {
  [key: string]: {
    data: any;
    timestamp: number;
    ttl: number;
  };
}

/**
 * Gerenciador de cache de queries com TTL por entrada.
 */
class QueryOptimizer {
  private cache: QueryCache = {};
  private readonly DEFAULT_TTL = 30000; // 30 segundos

  /**
   * Executa função de consulta com cache por chave.
   * Se houver entrada válida, retorna do cache; senão executa a função,
   * armazena e retorna o resultado.
   *
   * @param key Chave única para identificar a consulta.
   * @param queryFn Função que realiza a consulta/ação e retorna Promise.
   * @param ttl Tempo de vida (TTL) em ms; padrão DEFAULT_TTL.
   */
  async executeWithCache<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const now = Date.now();
    const cached = this.cache[key];

    // Verificar se há cache válido
    if (cached && (now - cached.timestamp) < cached.ttl) {
      return cached.data;
    }

    // Executar query
    const result = await queryFn();

    // Armazenar no cache
    this.cache[key] = {
      data: result,
      timestamp: now,
      ttl,
    };

    return result;
  }

  /**
   * Invalida uma chave específica ou tudo se nenhuma chave for fornecida.
   */
  invalidate(key?: string): void {
    if (key) {
      delete this.cache[key];
    } else {
      this.cache = {};
    }
  }

  /**
   * Remove entradas cujo TTL tenha expirado.
   */
  cleanExpired(): void {
    const now = Date.now();
    for (const key in this.cache) {
      const cached = this.cache[key];
      if (cached && (now - cached.timestamp) >= cached.ttl) {
        delete this.cache[key];
      }
    }
  }

  /**
   * Retorna estatísticas simples do cache atual.
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: Object.keys(this.cache).length,
      keys: Object.keys(this.cache),
    };
  }
}

/**
 * Instância global do otimizador para uso compartilhado.
 */
export const queryOptimizer = new QueryOptimizer();

/**
 * Decorator para otimizar funções assíncronas de consulta via cache.
 *
 * Constrói uma chave composta por cacheKey + args e delega ao queryOptimizer.
 *
 * @param fn Função assíncrona original.
 * @param cacheKey Prefixo de chave para o cache.
 * @param ttl TTL opcional em ms.
 */
export function withQueryOptimization<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  cacheKey: string,
  ttl?: number
) {
  return async (...args: T): Promise<R> => {
    const key = `${cacheKey}:${JSON.stringify(args)}`;
    return queryOptimizer.executeWithCache(key, () => fn(...args), ttl);
  };
}

/**
 * Cria uma função de consulta otimizada (ex.: Prisma) com cache e TTL.
 *
 * @param queryFn Função original da consulta.
 * @param cacheKey Prefixo da chave de cache.
 * @param ttl TTL em ms; padrão 30000.
 */
export function createOptimizedQuery<T extends any[], R>(
  queryFn: (...args: T) => Promise<R>,
  cacheKey: string,
  ttl: number = 30000
) {
  return withQueryOptimization(queryFn, cacheKey, ttl);
}

/**
 * Utilitários com queries comuns otimizadas via Prisma.
 * Exemplos incluem buscar usuário, pedidos recentes e contagem de pedidos.
 * TTLs são ajustados de acordo com a natureza dos dados (ex.: usuário 5min,
 * pedidos 1min).
 */
export const optimizedQueries = {
  // Query otimizada para buscar usuário
  findUser: createOptimizedQuery(
    async (id: string, prisma: any) => {
      return prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      });
    },
    'user:findUnique',
    300000 // 5 minutos
  ),

  // Query otimizada para buscar pedidos
  findOrders: createOptimizedQuery(
    async (customerId: string, prisma: any) => {
      return prisma.order.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                },
              },
            },
          },
        },
      });
    },
    'orders:findMany',
    60000 // 1 minuto
  ),

  // Query otimizada para contar pedidos
  countOrders: createOptimizedQuery(
    async (customerId: string, prisma: any) => {
      return prisma.order.count({
        where: { customerId },
      });
    },
    'orders:count',
    60000 // 1 minuto
  ),
};

/**
 * Limpeza periódica do cache em ambiente de servidor (Node.js).
 * Executa a cada minuto para remover entradas expiradas.
 */
if (typeof window === 'undefined') {
  setInterval(() => {
    queryOptimizer.cleanExpired();
  }, 60000); // A cada minuto
}
