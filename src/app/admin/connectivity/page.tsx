'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  ServerIcon,
  CloudIcon,
  CpuChipIcon,
  SignalIcon
} from '@heroicons/react/24/outline'

interface TestResult {
  success: boolean
  message: string
  timestamp: string
  [key: string]: any
}

interface ConnectivityResults {
  timestamp: string
  environment: any
  tests: Record<string, TestResult>
  summary: {
    total: number
    successful: number
    failed: number
    success: boolean
    percentage: number
  }
}

export default function ConnectivityDashboard() {
  const [supabaseResults, setSupabaseResults] = useState<ConnectivityResults | null>(null)
  const [vercelResults, setVercelResults] = useState<ConnectivityResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Função para testar Supabase
  const testSupabase = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/test/supabase')
      const data = await response.json()
      setSupabaseResults(data)
    } catch (error) {
      console.error('Erro ao testar Supabase:', error)
      setSupabaseResults({
        timestamp: new Date().toISOString(),
        environment: {},
        tests: {},
        summary: { total: 0, successful: 0, failed: 1, success: false, percentage: 0 }
      })
    }
  }

  // Função para testar Vercel
  const testVercel = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/test/vercel')
      const data = await response.json()
      setVercelResults(data)
    } catch (error) {
      console.error('Erro ao testar Vercel:', error)
      setVercelResults({
        timestamp: new Date().toISOString(),
        environment: {},
        tests: {},
        summary: { total: 0, successful: 0, failed: 1, success: false, percentage: 0 }
      })
    }
  }

  // Função para executar todos os testes
  const runAllTests = async () => {
    setLoading(true)
    await Promise.all([testSupabase(), testVercel()])
    setLastUpdate(new Date())
    setLoading(false)
  }

  // Executar testes na inicialização
  useEffect(() => {
    runAllTests()
  }, [])

  // Componente para exibir status
  const StatusIcon = ({ success }: { success: boolean }) => {
    return success ? (
      <CheckCircleIcon className="h-5 w-5 text-green-500" />
    ) : (
      <XCircleIcon className="h-5 w-5 text-red-500" />
    )
  }

  // Componente para exibir badge de status
  const StatusBadge = ({ success, percentage }: { success: boolean; percentage: number }) => {
    const variant = success ? 'success' : percentage > 50 ? 'warning' : 'destructive'
    const text = success ? 'Conectado' : percentage > 50 ? 'Parcial' : 'Falhou'
    
    return (
      <Badge variant={variant as any}>
        {text} ({percentage}%)
      </Badge>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard de Conectividade
          </h1>
          <p className="text-gray-600 mt-2">
            Monitore a conectividade com Vercel e Supabase
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={runAllTests} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <ClockIcon className="h-4 w-4 animate-spin" />
            ) : (
              <SignalIcon className="h-4 w-4" />
            )}
            {loading ? 'Testando...' : 'Testar Tudo'}
          </Button>
        </div>
      </div>

      {/* Última atualização */}
      {lastUpdate && (
        <div className="text-sm text-gray-500">
          Última atualização: {lastUpdate.toLocaleString('pt-BR')}
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supabase */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <ServerIcon className="h-5 w-5 text-blue-500" />
              Supabase
            </CardTitle>
            {supabaseResults && (
              <StatusBadge 
                success={supabaseResults.summary.success} 
                percentage={supabaseResults.summary.percentage} 
              />
            )}
          </CardHeader>
          <CardContent>
            {supabaseResults ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status Geral</span>
                  <StatusIcon success={supabaseResults.summary.success} />
                </div>
                <div className="text-2xl font-bold">
                  {supabaseResults.summary.successful}/{supabaseResults.summary.total}
                </div>
                <div className="text-sm text-gray-600">
                  Testes aprovados
                </div>
                
                {/* Detalhes dos testes */}
                <div className="space-y-2 pt-2 border-t">
                  {Object.entries(supabaseResults.tests).map(([testName, result]) => (
                    <div key={testName} className="flex justify-between items-center">
                      <span className="text-sm capitalize">{testName}</span>
                      <StatusIcon success={result.success} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-24">
                <ClockIcon className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vercel */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <CloudIcon className="h-5 w-5 text-black" />
              Vercel
            </CardTitle>
            {vercelResults && (
              <StatusBadge 
                success={vercelResults.summary.success} 
                percentage={vercelResults.summary.percentage} 
              />
            )}
          </CardHeader>
          <CardContent>
            {vercelResults ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status Geral</span>
                  <StatusIcon success={vercelResults.summary.success} />
                </div>
                <div className="text-2xl font-bold">
                  {vercelResults.summary.successful}/{vercelResults.summary.total}
                </div>
                <div className="text-sm text-gray-600">
                  Testes aprovados
                </div>
                
                {/* Informações do ambiente */}
                {vercelResults.environment && (
                  <div className="space-y-1 pt-2 border-t">
                    <div className="text-xs text-gray-500">
                      Ambiente: {vercelResults.environment.isVercel ? 'Vercel' : 'Local'}
                    </div>
                    {vercelResults.environment.username && (
                      <div className="text-xs text-gray-500">
                        Username: {vercelResults.environment.username}
                      </div>
                    )}
                    {vercelResults.environment.projectName && (
                      <div className="text-xs text-gray-500">
                        Projeto: {vercelResults.environment.projectName}
                      </div>
                    )}
                    {vercelResults.environment.region && (
                      <div className="text-xs text-gray-500">
                        Região: {vercelResults.environment.region}
                      </div>
                    )}
                    {vercelResults.environment.deploymentUrl && (
                      <div className="text-xs text-gray-500">
                        URL: {vercelResults.environment.deploymentUrl}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Detalhes dos testes */}
                <div className="space-y-2 pt-2 border-t">
                  {Object.entries(vercelResults.tests).map(([testName, result]) => (
                    <div key={testName} className="flex justify-between items-center">
                      <span className="text-sm capitalize">{testName}</span>
                      <StatusIcon success={result.success} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-24">
                <ClockIcon className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detalhes técnicos */}
      {(supabaseResults || vercelResults) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CpuChipIcon className="h-5 w-5" />
              Detalhes Técnicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Detalhes Supabase */}
              {supabaseResults && (
                <div>
                  <h4 className="font-medium mb-3">Supabase</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Timestamp:</span>
                      <div className="font-mono text-xs">
                        {new Date(supabaseResults.timestamp).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    {Object.entries(supabaseResults.tests).map(([testName, result]) => (
                      <div key={testName}>
                        <span className="text-gray-600 capitalize">{testName}:</span>
                        <div className="font-mono text-xs text-gray-800">
                          {result.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detalhes Vercel */}
              {vercelResults && (
                <div>
                  <h4 className="font-medium mb-3">Vercel</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Timestamp:</span>
                      <div className="font-mono text-xs">
                        {new Date(vercelResults.timestamp).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    {vercelResults.environment && (
                      <div>
                        <span className="text-gray-600">Ambiente:</span>
                        <div className="font-mono text-xs">
                          {JSON.stringify(vercelResults.environment, null, 2)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}