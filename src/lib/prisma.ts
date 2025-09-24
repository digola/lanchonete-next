import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configurar DATABASE_URL padrão se não estiver definida
if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL não definida. Usando SQLite para desenvolvimento local.');
  process.env.DATABASE_URL = 'file:./dev.db';
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

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

// Middleware para logging de queries (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  prisma.$use(async (params: any, next: any) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    
    console.log(`🔍 Query ${params.model}.${params.action} took ${after - before}ms`);
    
    return result;
  });
}

export default prisma;
