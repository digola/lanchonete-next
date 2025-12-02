import { PrismaClient } from '@prisma/client';

/**
 * Armazena instância global do Prisma para evitar múltiplas conexões
 * em ambiente de desenvolvimento (hot reload).
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Detectar ambiente de produção
const isProdLike = process.env.NODE_ENV === 'production';

/**
 * Configura DATABASE_URL padrão (SQLite) apenas em desenvolvimento local,
 * e alerta quando variável está ausente em produção.
 */
if (!process.env.DATABASE_URL) {
  if (isProdLike) {
    // Em produção, não usar SQLite e exigir configuração explícita de DATABASE_URL
    console.error('❌ DATABASE_URL não definida em produção. Configure a variável de ambiente no servidor.');
  } else {
    console.warn('⚠️ DATABASE_URL não definida. Usando SQLite para desenvolvimento local.');
    process.env.DATABASE_URL = 'file:./dev.db';
  }
}

/**
 * Lazy initialization: cria o client apenas no primeiro acesso.
 * Em desenvolvimento, reaproveita instância global para evitar excesso
 * de conexões ao banco durante hot reload.
 */
let prismaClient: PrismaClient | undefined = globalForPrisma.prisma;

// Ampliar tipo para permitir acesso dinâmico a modelos recém-gerados
/**
 * Exporta um Proxy que inicializa o PrismaClient sob demanda e permite
 * acesso dinâmico aos modelos gerados sem necessidade de reimportação.
 */
export const prisma: (PrismaClient & { [key: string]: any }) = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    if (!prismaClient) {
      // Bloquear inicialização sem DATABASE_URL em ambientes de produção
      if (isProdLike && !process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL não definida no ambiente de produção. Configure-a no servidor para habilitar o banco de dados.');
      }
      prismaClient = new PrismaClient();
      if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = prismaClient;
      }
    }
    // @ts-ignore acessa propriedades dinamicamente do PrismaClient
    return Reflect.get(prismaClient, prop, receiver);
  }
});

/**
 * Conecta ao banco de dados usando prisma.$connect().
 * Útil para verificar conectividade durante inicialização.
 */
export const connectDatabase = async () => {
  try {
    // força criação do client e conexão
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados');
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error);
    throw error;
  }
};

/**
 * Desconecta do banco de dados (boa prática em scripts/teardowns).
 */
export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    console.log('✅ Desconectado do banco de dados');
  } catch (error) {
    console.error('❌ Erro ao desconectar do banco de dados:', error);
    throw error;
  }
};

/**
 * Verifica saúde do banco executando SELECT 1 via $queryRaw.
 */
export const checkDatabaseHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { healthy: true, message: 'Database is healthy' };
  } catch (error) {
    return { healthy: false, message: 'Database connection failed' };
  }
};

/**
 * Middleware de logging de queries (apenas em desenvolvimento).
 * Registra tempo de execução de cada operação Prisma.
 */
if (process.env.NODE_ENV === 'development') {
  // inicializa e aplica middleware somente quando usado
  (async () => {
    const client = (prisma as unknown as PrismaClient);
    client.$use(async (params: any, next: any) => {
      const before = Date.now();
      const result = await next(params);
      const after = Date.now();
      console.log(`🔍 Query ${params.model}.${params.action} took ${after - before}ms`);
      return result;
    });
  })().catch(() => {});
}

export default prisma;
