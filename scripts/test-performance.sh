#!/bin/bash
# Script para testar performance das APIs

echo "🚀 TESTE DE PERFORMANCE - APIs Otimizadas"
echo "=========================================="
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para fazer requisição e medir tempo
test_endpoint() {
  local endpoint=$1
  local description=$2
  local iterations=${3:-5}
  
  echo ""
  echo "📊 Testando: $description"
  echo "Endpoint: $endpoint"
  echo "Iterações: $iterations"
  echo "---"
  
  total_time=0
  declare -a times
  
  for i in $(seq 1 $iterations); do
    # Fazer requisição e medir tempo
    start=$(date +%s%N | cut -b1-13)
    response=$(curl -s -w "\n%{http_code}" "$endpoint")
    end=$(date +%s%N | cut -b1-13)
    
    elapsed=$((end - start))
    times+=($elapsed)
    total_time=$((total_time + elapsed))
    
    http_code=$(echo "$response" | tail -1)
    
    if [ "$http_code" == "200" ]; then
      echo -e "${GREEN}✓ Iteração $i: ${elapsed}ms${NC}"
    else
      echo -e "${RED}✗ Iteração $i: ${elapsed}ms (HTTP $http_code)${NC}"
    fi
  done
  
  average=$((total_time / iterations))
  min=${times[0]}
  max=${times[0]}
  
  for t in "${times[@]}"; do
    if [ $t -lt $min ]; then min=$t; fi
    if [ $t -gt $max ]; then max=$t; fi
  done
  
  echo ""
  echo -e "Resultados:"
  echo -e "  Tempo médio: ${YELLOW}${average}ms${NC}"
  echo -e "  Mínimo: ${GREEN}${min}ms${NC}"
  echo -e "  Máximo: ${RED}${max}ms${NC}"
  echo -e "  Total: ${average}ms × $iterations = $((total_time))ms"
}

# Verificar se servidor está rodando
BASE_URL="http://localhost:3000"

echo "Verificando disponibilidade do servidor..."
if ! curl -s "$BASE_URL/api/health" > /dev/null; then
  echo -e "${RED}❌ Servidor não está rodando em $BASE_URL${NC}"
  echo "Inicie com: npm run dev"
  exit 1
fi
echo -e "${GREEN}✓ Servidor disponível${NC}"
echo ""

# Testar endpoints
test_endpoint "$BASE_URL/api/settings/public" "Settings Públicas (COM CACHE)" 10
test_endpoint "$BASE_URL/api/categories?limit=20&page=1" "Categorias (Queries Paralelas)" 10
test_endpoint "$BASE_URL/api/categories?limit=20&page=1&includeProducts=true" "Categorias com Produtos" 5

echo ""
echo "=========================================="
echo "✅ Testes concluídos!"
echo ""
echo "💡 Dicas:"
echo "   - Primeira requisição é sempre mais lenta (sem cache)"
echo "   - Requisições subsequentes usam cache"
echo "   - Esperado: ~500ms (primeira) → ~50ms (cache hit)"
