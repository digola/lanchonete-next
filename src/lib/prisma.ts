import type { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configurar DATABASE_URL padrão se não estiver definida
if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL não definida. Usando SQLite para desenvolvimento local.');
  process.env.DATABASE_URL = 'file:./dev.db';
}

let prismaInstance: PrismaClient | undefined = globalForPrisma.prisma;

function createClient(): PrismaClient {
  const { PrismaClient } = require('@prisma/client') as typeof import('@prisma/client');
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const getPrisma = (): PrismaClient => {
  if (!prismaInstance) {
    prismaInstance = createClient();
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaInstance;
  }
  return prismaInstance;
};

// Proxy para inicialização lazy: só cria o cliente quando for usado
export const prisma = new Proxy({}, {
  get(_target, prop) {
    const client = getPrisma() as unknown as Record<string | symbol, unknown>;
    return client[prop as keyof typeof client];
  }
}) as unknown as PrismaClient;

// Função para conectar ao banco
export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados PostgreSQL');
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
    return { healthy: false, message: 'Database connection failed' };
  }
};

// Middleware para logging de queries (desabilitado por padrão)
// Para habilitar, defina ENABLE_QUERY_LOGS=true no .env
if (process.env.NODE_ENV === 'development' && process.env.ENABLE_QUERY_LOGS === 'true') {
  prisma.$use(async (params: any, next: any) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    
    // Log apenas queries muito lentas (>500ms)
    if (after - before > 500) {
      console.log(`⚠️ Very Slow Query: ${params.model}.${params.action} took ${after - before}ms`);
      console.log(`   Model: ${params.model}, Action: ${params.action}`);
    }
    
    return result;
  });
}

export default prisma;
