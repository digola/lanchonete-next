# Script para testar performance das APIs (Windows PowerShell)
# Uso: .\scripts\test-performance.ps1

param(
    [int]$iterations = 5,
    [string]$baseUrl = "http://localhost:3000"
)

Write-Host "🚀 TESTE DE PERFORMANCE - APIs Otimizadas" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Função para fazer requisição e medir tempo
function Test-Endpoint {
    param(
        [string]$endpoint,
        [string]$description,
        [int]$iters = $iterations
    )
    
    Write-Host ""
    Write-Host "📊 Testando: $description" -ForegroundColor Yellow
    Write-Host "Endpoint: $endpoint"
    Write-Host "Iterações: $iters"
    Write-Host "---"
    
    $times = @()
    $totalTime = 0
    $successCount = 0
    
    for ($i = 1; $i -le $iters; $i++) {
        try {
            $start = Get-Date
            $response = Invoke-WebRequest -Uri $endpoint -UseBasicParsing
            $end = Get-Date
            
            $elapsed = ($end - $start).TotalMilliseconds
            $times += $elapsed
            $totalTime += $elapsed
            
            if ($response.StatusCode -eq 200) {
                Write-Host "✓ Iteração $i`: $([math]::Round($elapsed))ms" -ForegroundColor Green
                $successCount++
            } else {
                Write-Host "✗ Iteração $i`: $([math]::Round($elapsed))ms (HTTP $($response.StatusCode))" -ForegroundColor Red
            }
        } catch {
            Write-Host "✗ Iteração $i`: Erro - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    if ($times.Count -gt 0) {
        $average = $totalTime / $times.Count
        $min = ($times | Measure-Object -Minimum).Minimum
        $max = ($times | Measure-Object -Maximum).Maximum
        
        Write-Host ""
        Write-Host "Resultados:" -ForegroundColor Cyan
        Write-Host "  Tempo médio: $([math]::Round($average))ms" -ForegroundColor Yellow
        Write-Host "  Mínimo: $([math]::Round($min))ms" -ForegroundColor Green
        Write-Host "  Máximo: $([math]::Round($max))ms" -ForegroundColor Red
        Write-Host "  Total: $($times.Count) × $([math]::Round($average))ms = $([math]::Round($totalTime))ms"
        Write-Host "  Sucesso: $successCount/$iters"
    }
}

# Verificar se servidor está rodando
Write-Host "Verificando disponibilidade do servidor..." -ForegroundColor Cyan

try {
    $health = Invoke-WebRequest -Uri "$baseUrl/api/health" -UseBasicParsing
    Write-Host "✓ Servidor disponível" -ForegroundColor Green
} catch {
    Write-Host "❌ Servidor não está rodando em $baseUrl" -ForegroundColor Red
    Write-Host "Inicie com: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Testar endpoints
Test-Endpoint "$baseUrl/api/settings/public" "Settings Públicas (COM CACHE)" 10
Test-Endpoint "$baseUrl/api/categories?limit=20&page=1" "Categorias (Queries Paralelas)" 10
Test-Endpoint "$baseUrl/api/categories?limit=20&page=1&includeProducts=true" "Categorias com Produtos" 5

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Testes concluídos!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Dicas:" -ForegroundColor Yellow
Write-Host "   - Primeira requisição é sempre mais lenta (sem cache)" -ForegroundColor White
Write-Host "   - Requisições subsequentes usam cache" -ForegroundColor White
Write-Host "   - Esperado: ~500ms (primeira) → ~50ms (cache hit)" -ForegroundColor White
