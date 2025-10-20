import { PrismaClient } from '@prisma/client';

// Evita múltiplas instâncias em dev (hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Detecta ambiente de produção
const isProdLike = process.env.NODE_ENV === 'production';

// Aliases para URLs de banco compatíveis com Supabase
const DB_ALIASES = [
  'DATABASE_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL',
  'SUPABASE_DB_URL',
];

// Resolve a melhor URL disponível
function resolveDatabaseUrl(): string | undefined {
  for (const key of DB_ALIASES) {
    const val = process.env[key];
    if (val && typeof val === 'string' && val.trim().length > 0) {
      return val.trim();
    }
  }
  return undefined;
}

// Garante que DATABASE_URL esteja definida
if (!process.env.DATABASE_URL) {
  const resolved = resolveDatabaseUrl();
  if (resolved) {
    process.env.DATABASE_URL = resolved;
  }
}

if (!process.env.DATABASE_URL) {
  const errorMsg = '❌ DATABASE_URL não definida. Configure no .env ou nas variáveis do Vercel.';
  console.error(errorMsg);
  throw new Error(errorMsg);
}

// Inicialização preguiçosa do PrismaClient
let prismaClient: PrismaClient | undefined = globalForPrisma.prisma;

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    if (!prismaClient) {
      prismaClient = new PrismaClient();
      if (!isProdLike) {
        globalForPrisma.prisma = prismaClient;
      }
    }
    // @ts-ignore: acesso dinâmico ao PrismaClient
    return Reflect.get(prismaClient, prop, receiver);
  },
});

// Conecta ao banco
export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados');
  } catch (error) {
    console.error('❌ Erro ao conectar:', error);
    throw error;
  }
};

// Desconecta do banco
export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    console.log('✅ Desconectado do banco de dados');
  } catch (error) {
    console.error('❌ Erro ao desconectar:', error);
    throw error;
  }
};

// Verifica saúde do banco
export const checkDatabaseHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { healthy: true, message: '✅ Banco operacional' };
  } catch (error) {
    return { healthy: false, message: '❌ Falha na conexão com o banco' };
  }
};

// Middleware de logging (apenas em dev)
if (!isProdLike) {
  (async () => {
    const client = prisma as PrismaClient;
    client.$use(async (params, next) => {
      const before = Date.now();
      const result = await next(params);
      const after = Date.now();
      console.log(`🔍 ${params.model}.${params.action} levou ${after - before}ms`);
      return result;
    });
  })().catch(() => {});
}

export default prisma;
