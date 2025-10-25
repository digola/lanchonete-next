import { PrismaClient } from '@prisma/client'

// Evita múltiplas instâncias em dev e melhora reuso em serverless
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Detecta ambiente de produção
const isProdLike = process.env.NODE_ENV === 'production'

// Aliases para URLs de banco compatíveis com Supabase
const DB_ALIASES = [
  'DATABASE_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL',
  'SUPABASE_DB_URL',
]

// Resolve a melhor URL disponível
function resolveDatabaseUrl(): string | undefined {
  for (const key of DB_ALIASES) {
    const val = process.env[key]
    if (val && typeof val === 'string' && val.trim().length > 0) {
      return val.trim()
    }
  }
  return undefined
}

// Garante que DATABASE_URL esteja definida
if (!process.env.DATABASE_URL) {
  const resolved = resolveDatabaseUrl()
  if (resolved) {
    process.env.DATABASE_URL = resolved
  }
}

// Não logar credenciais em produção
if (!isProdLike) {
  console.log('DATABASE_URL being used:', process.env.DATABASE_URL)
}

if (!process.env.DATABASE_URL) {
  const errorMsg = '❌ DATABASE_URL não definida. Configure no .env ou nas variáveis do Vercel.'
  console.error(errorMsg)
  throw new Error(errorMsg)
}

// Inicialização preguiçosa do PrismaClient com cache global (inclusive em produção)
let prismaClient: PrismaClient | undefined = globalForPrisma.prisma

function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    prismaClient = new PrismaClient()
    // Cachear também em produção para reduzir reconexões em serverless
    globalForPrisma.prisma = prismaClient
  }
  return prismaClient
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient()
    // @ts-ignore: acesso dinâmico ao PrismaClient
    return Reflect.get(client, prop, receiver)
  },
})

// Conecta ao banco (use com cautela em rotas; o client conecta sob demanda)
export const connectDatabase = async () => {
  try {
    await prisma.$connect()
    if (!isProdLike) console.log('✅ Conectado ao banco de dados')
  } catch (error) {
    console.error('❌ Erro ao conectar:', error)
    throw error
  }
}

// Não desconectar em serverless para evitar churn de conexões
export const disconnectDatabase = async () => {
  try {
    if (!isProdLike) {
      await prisma.$disconnect()
      console.log('✅ Desconectado do banco de dados')
    }
  } catch (error) {
    console.error('❌ Erro ao desconectar:', error)
    throw error
  }
}

// Verifica saúde do banco
export const checkDatabaseHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { healthy: true, message: '✅ Banco operacional' }
  } catch (error) {
    return { healthy: false, message: '❌ Falha na conexão com o banco' }
  }
}

// Middleware de logging (apenas em dev)
if (!isProdLike) {
  ;(async () => {
    const client = getPrismaClient()
    client.$use(async (params, next) => {
      const before = Date.now()
      const result = await next(params)
      const after = Date.now()
      console.log(`🔍 ${params.model}.${params.action} levou ${after - before}ms`)
      return result
    })
  })().catch(() => {})
}

export default prisma
