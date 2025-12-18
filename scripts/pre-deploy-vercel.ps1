Param(
  [switch]$SkipBuild
)

Write-Host "=== Pre-Deploy Vercel (Supabase + Prisma) ===" -ForegroundColor Cyan

# 1) Validar DATABASE_URL
if (-not $env:DATABASE_URL -or $env:DATABASE_URL.Trim() -eq "") {
  Write-Error "DATABASE_URL não definida. Configure a variável de ambiente apontando para Supabase Postgres (com sslmode=require).";
  exit 1
}

$dbUrl = $env:DATABASE_URL
Write-Host "DATABASE_URL: $dbUrl" -ForegroundColor Yellow

if ($dbUrl -notmatch "supabase\.co") {
  Write-Warning "DATABASE_URL não parece Supabase. Prossigo, mas confirme o host.";
}

if ($dbUrl -match ":5432") {
  Write-Warning "Porta 5432 detectada. Recomenda-se usar pooling 6543 em ambientes serverless (Vercel)."
}

if ($dbUrl -notmatch "sslmode=require") {
  Write-Warning "sslmode=require não detectado. Recomenda-se habilitar SSL na conexão."
}

# 2) Type-check
Write-Host "Rodando type-check..." -ForegroundColor Cyan
npm run type-check
if ($LASTEXITCODE -ne 0) { Write-Error "Type-check falhou"; exit $LASTEXITCODE }

# 3) Lint
Write-Host "Rodando lint..." -ForegroundColor Cyan
npm run lint
if ($LASTEXITCODE -ne 0) { Write-Error "Lint falhou"; exit $LASTEXITCODE }

# 4) Prisma generate
Write-Host "Gerando Prisma Client..." -ForegroundColor Cyan
npm run db:generate
if ($LASTEXITCODE -ne 0) { Write-Error "Prisma generate falhou"; exit $LASTEXITCODE }

# 5) Verificar status de migrations (não aplica automaticamente)
Write-Host "Verificando status de migrations..." -ForegroundColor Cyan
try {
  $status = npx prisma migrate status --schema=prisma/schema.prisma 2>&1
  Write-Host $status
  if ($status -match "have not been applied" -or $status -match "Pending migrations") {
    Write-Warning "Há migrations pendentes. Aplique no Supabase antes do deploy (npx prisma migrate deploy)."
  }
} catch {
  Write-Warning "Não foi possível verificar status das migrations. Prosseguindo.";
}

# 6) Build (opcional)
if (-not $SkipBuild) {
  Write-Host "Rodando build (Next.js)..." -ForegroundColor Cyan
  npm run build
  if ($LASTEXITCODE -ne 0) { Write-Error "Build falhou"; exit $LASTEXITCODE }
}

Write-Host "Pre-Deploy finalizado com sucesso." -ForegroundColor Green
