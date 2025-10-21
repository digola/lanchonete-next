// Utilitários para testes de conectividade com Vercel

export interface VercelEnvironmentInfo {
  isVercel: boolean
  region?: string | undefined
  deploymentUrl?: string | undefined
  environment?: string | undefined
  buildId?: string | undefined
  gitCommitSha?: string | undefined
  gitCommitRef?: string | undefined
  projectName?: string | undefined
  teamId?: string | undefined
  username?: string | undefined
}

export interface VercelConnectivityTest {
  success: boolean
  message: string
  timestamp: string
  environment: VercelEnvironmentInfo
  performance?: {
    responseTime: number
    memoryUsage: NodeJS.MemoryUsage
  }
  headers?: Record<string, string>
}

// Função para detectar se está rodando no Vercel
export function getVercelEnvironmentInfo(): VercelEnvironmentInfo {
  const isVercel = !!(
    process.env.VERCEL || 
    process.env.VERCEL_ENV || 
    process.env.VERCEL_URL
  )

  return {
    isVercel,
    region: process.env.VERCEL_REGION,
    deploymentUrl: process.env.VERCEL_URL,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    buildId: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7),
    gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA,
    gitCommitRef: process.env.VERCEL_GIT_COMMIT_REF,
    projectName: 'lanchonete-next',
    teamId: process.env.VERCEL_TEAM_ID,
    username: 'digolanet-5544'
  }
}

function resolveBaseUrl(providedBase?: string): string {
  if (providedBase && providedBase.trim().length > 0) {
    return providedBase.replace(/\/$/, '')
  }
  const envBase = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL
  if (envBase && envBase.trim().length > 0) {
    return envBase.replace(/\/$/, '')
  }
  const env = getVercelEnvironmentInfo()
  if (env.deploymentUrl) {
    const dep = env.deploymentUrl
    // VERCEL_URL geralmente vem sem protocolo
    return dep.startsWith('http') ? dep.replace(/\/$/, '') : `https://${dep}`
  }
  // Fallback para desenvolvimento
  const port = process.env.PORT || '3000'
  return `http://localhost:${port}`
}

// Função para testar conectividade e performance do Vercel
export async function testVercelConnectivity(baseUrl?: string): Promise<VercelConnectivityTest> {
  const startTime = Date.now()
  const environment = getVercelEnvironmentInfo()

  try {
    const base = resolveBaseUrl(baseUrl)
    const healthUrl = new URL('/api/test/vercel/health', base)
    // Testa conectividade básica
    const response = await fetch(healthUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Vercel-Connectivity-Test'
      }
    })

    const responseTime = Date.now() - startTime
    const memoryUsage = process.memoryUsage()

    if (!response.ok) {
      return {
        success: false,
        message: `Erro HTTP ${response.status}: ${response.statusText}`,
        timestamp: new Date().toISOString(),
        environment,
        performance: {
          responseTime,
          memoryUsage
        }
      }
    }

    const data = await response.json()

    return {
      success: true,
      message: 'Conectividade com Vercel testada com sucesso',
      timestamp: new Date().toISOString(),
      environment,
      performance: {
        responseTime,
        memoryUsage
      },
      headers: (() => {
        const headersObj: Record<string, string> = {}
        response.headers.forEach((value, key) => {
          headersObj[key] = value
        })
        return headersObj
      })()
    }

  } catch (error) {
    const responseTime = Date.now() - startTime
    const memoryUsage = process.memoryUsage()

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido na conectividade',
      timestamp: new Date().toISOString(),
      environment,
      performance: {
        responseTime,
        memoryUsage
      }
    }
  }
}

// Função para testar edge functions do Vercel
export async function testVercelEdgeFunctions(): Promise<VercelConnectivityTest> {
  const startTime = Date.now()
  const environment = getVercelEnvironmentInfo()

  try {
    // Testa se edge functions estão disponíveis
    const isEdgeRuntime = process.env.NEXT_RUNTIME === 'edge'
    
    const responseTime = Date.now() - startTime
    const memoryUsage = process.memoryUsage()

    return {
      success: true,
      message: isEdgeRuntime ? 'Edge Runtime ativo' : 'Node.js Runtime ativo',
      timestamp: new Date().toISOString(),
      environment: {
        ...environment,
        runtime: process.env.NEXT_RUNTIME || 'nodejs'
      } as any,
      performance: {
        responseTime,
        memoryUsage
      }
    }

  } catch (error) {
    const responseTime = Date.now() - startTime
    const memoryUsage = process.memoryUsage()

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao testar Edge Functions',
      timestamp: new Date().toISOString(),
      environment,
      performance: {
        responseTime,
        memoryUsage
      }
    }
  }
}

// Função para obter métricas de performance do Vercel
export function getVercelPerformanceMetrics() {
  const memoryUsage = process.memoryUsage()
  const uptime = process.uptime()
  
  return {
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100, // MB
      rss: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100 // MB
    },
    uptime: {
      seconds: Math.round(uptime),
      formatted: formatUptime(uptime)
    },
    timestamp: new Date().toISOString()
  }
}

// Função auxiliar para formatar tempo de atividade
function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  return `${hours}h ${minutes}m ${secs}s`
}