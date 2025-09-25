/**
 * Otimizador de queries para melhorar performance
 */

interface QueryCache {
  [key: string]: {
    data: any;
    timestamp: number;
    ttl: number;
  };
}

class QueryOptimizer {
  private cache: QueryCache = {};
  private readonly DEFAULT_TTL = 30000; // 30 segundos

  /**
   * Executa query com cache
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
   * Invalidar cache
   */
  invalidate(key?: string): void {
    if (key) {
      delete this.cache[key];
    } else {
      this.cache = {};
    }
  }

  /**
   * Limpar cache expirado
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
   * Obter estatísticas do cache
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: Object.keys(this.cache).length,
      keys: Object.keys(this.cache),
    };
  }
}

// Instância global do otimizador
export const queryOptimizer = new QueryOptimizer();

/**
 * Decorator para otimizar funções de query
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
 * Hook para otimizar queries do Prisma
 */
export function createOptimizedQuery<T extends any[], R>(
  queryFn: (...args: T) => Promise<R>,
  cacheKey: string,
  ttl: number = 30000
) {
  return withQueryOptimization(queryFn, cacheKey, ttl);
}

/**
 * Utilitários para otimização de queries específicas
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

// Limpar cache expirado periodicamente
if (typeof window === 'undefined') {
  setInterval(() => {
    queryOptimizer.cleanExpired();
  }, 60000); // A cada minuto
}
