import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Detectar ambiente de produção (cloud)
const isProdLike = process.env.NODE_ENV === 'production';

// Aliases/fallbacks para variáveis de ambiente de banco (compat com Supabase/Prisma)
const DB_ALIASES = [
  'DATABASE_URL',
  'POSTGRES_PRISMA_URL', // Supabase: Prisma URL (pooled)
  'POSTGRES_URL',        // Supabase: pooled URL
  'SUPABASE_DB_URL',     // genérico
];

function resolveDatabaseUrl(): string | undefined {
  for (const key of DB_ALIASES) {
    const val = process.env[key];
    if (val && typeof val === 'string' && val.trim().length > 0) {
      return val.trim();
    }
  }
  return undefined;
}

// Configuração estrita: exigir DATABASE_URL (PostgreSQL) em todos os ambientes
if (!process.env.DATABASE_URL) {
  const resolved = resolveDatabaseUrl();
  if (resolved && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = resolved;
  }
}
if (!process.env.DATABASE_URL) {
  const errorMsg = 'DATABASE_URL não definida. Configure no .env local (PostgreSQL) ou nas variáveis do serviço (ex.: Render).';
  if (isProdLike) {
    console.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  } else {
    console.warn(`⚠️ ${errorMsg}`);
    throw new Error(errorMsg);
  }
}

// Lazy initialization: cria o client apenas no primeiro acesso
let prismaClient: PrismaClient | undefined = globalForPrisma.prisma;

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    if (!prismaClient) {
      // Bloquear inicialização sem DATABASE_URL em ambientes de produção/cloud
      if (isProdLike && !process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL não definida no ambiente de produção. Configure-a no serviço (ex.: Render) para habilitar o banco de dados.');
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
    return { healthy: false, message: 'Database connection failed' };
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
