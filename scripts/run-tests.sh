#!/bin/bash
# Script para executar testes completos da arquitetura

echo "═══════════════════════════════════════════════════════════"
echo "🚀 TESTE E DEBUG COMPLETO DA ARQUITETURA"
echo "═══════════════════════════════════════════════════════════"

# 1. Verificar TypeScript
echo ""
echo "1️⃣  Verificando TypeScript..."
npx tsc --noEmit 2>&1 | head -20

# 2. Verificar ESLint
echo ""
echo "2️⃣  Verificando ESLint..."
npx eslint "src/**/*.{ts,tsx}" --max-warnings 10 2>&1 | head -20 || true

# 3. Tipo check
echo ""
echo "3️⃣  Type checking..."
npx tsc --noEmit || echo "⚠️  Existem erros de tipo"

# 4. Build check
echo ""
echo "4️⃣  Verificando build..."
npm run build 2>&1 | tail -30 || echo "⚠️  Build falhou - veja detalhes acima"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ TESTES CONCLUÍDOS"
echo "═══════════════════════════════════════════════════════════"
