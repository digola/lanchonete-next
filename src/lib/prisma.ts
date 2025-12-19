import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Detectar ambiente de produção
const isProdLike = process.env.NODE_ENV === 'production';

if (!process.env.DATABASE_URL) {
  if (isProdLike) {
    const candidate =
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL ||
      undefined;
    if (candidate) {
      process.env.DATABASE_URL = candidate;
    } else {
      console.error('❌ DATABASE_URL não definida em produção. Configure a variável de ambiente (DATABASE_URL ou POSTGRES_PRISMA_URL) no servidor.');
    }
  } else {
    console.warn('⚠️ DATABASE_URL não definida. Usando SQLite para desenvolvimento local.');
    process.env.DATABASE_URL = 'file:./dev.db';
  }
}

// Lazy initialization: cria o client apenas no primeiro acesso
let prismaClient: PrismaClient | undefined = globalForPrisma.prisma;

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
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

// Função para conectar ao banco
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

// Função para desconectar do banco
export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    console.log('✅ Desconectado do banco de dados');
  } catch (error) {
    console.error('❌ Erro ao desconectar do banco de dados:', error);
    throw error;
  }
};

// Função para verificar saúde do banco
export const checkDatabaseHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { healthy: true, message: 'Database is healthy' };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Database connection failed';
    return { healthy: false, message };
  }
};

// Middleware para logging de queries (apenas em desenvolvimento)
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
