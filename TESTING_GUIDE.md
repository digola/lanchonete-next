# 📖 Guia de Uso dos Scripts de Teste e Debug

## Scripts Disponíveis

### 1. **analyze-architecture.ts** - Análise Estática
Procura por erros comuns na arquitetura do projeto.

**Uso:**
```bash
npx tsx scripts/analyze-architecture.ts
```

**O que verifica:**
- ✅ Imports não utilizados
- ✅ Erros de tipagem (uso de `any`)
- ✅ TODO/FIXME comentários
- ✅ Tratamento de erro inadequado
- ✅ Violações de React Hooks Rules
- ✅ Validação de rotas de API
- ✅ Middleware configuration
- ✅ Tipos de banco de dados
- ✅ Configurações de build

**Output:**
```
[INFO] 🚀 Iniciando Análise Estática...
[INFO] 🔍 Verificando imports não utilizados...
[INFO] ✅ Verificados 137 arquivos
...
[ERROR] ❌ Erros: 42
[WARN] ⚠️  Avisos: 75
[INFO] ℹ️  Informações: 3
```

**Próximas ações:**
1. Corrigir erros críticos (severity: error)
2. Revisar avisos (severity: warning)
3. Ler informações (severity: info)

---

### 2. **test-architecture.ts** - Teste de Endpoints
Testa todas as rotas de API e validações de dados.

**Uso:**
```bash
# Sem autenticação (alguns testes serão pulados)
npx tsx scripts/test-architecture.ts

# Com autenticação (todos os testes serão executados)
API_URL=http://localhost:3000 TEST_TOKEN="seu_token_jwt" npx tsx scripts/test-architecture.ts
```

**Variáveis de Ambiente:**
- `API_URL` - URL da API (padrão: http://localhost:3000)
- `TEST_TOKEN` - Token JWT para testes autenticados

**O que testa:**
- 📡 **Endpoints:** GET /api/health, /api/settings/publicas, /api/categories, etc
- 🏗️ **Estruturas:** Validação de schemas de resposta
- 🔐 **Permissões:** Autenticação e autorização
- 💾 **Cache:** Verificação de cache headers
- ✔️ **Validações:** Rejeição de dados inválidos
- 🔗 **Relacionamentos:** Integridade de dados relacionados

**Output:**
```
[INFO] 🚀 Iniciando Validação da Arquitetura...
[INFO] Base URL: http://localhost:3000
[INFO] Autenticação: NÃO (alguns testes serão pulados)

📡 Testando Endpoints da API...
✅ GET /api/health (45ms)
✅ GET /api/settings/publicas (102ms)
✅ GET /api/categories (87ms)
...

📊 RESUMO DOS TESTES
✅ Passou: 15/18
❌ Falhou: 2/18
⏭️  Pulado: 1/18
⏱️  Tempo Total: 2345ms
```

**Obtendo um Token JWT:**
```bash
# 1. Fazer login na aplicação
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staff@example.com","password":"senha123"}'

# 2. Copiar o token da resposta
# 3. Usar como variável de ambiente
```

---

### 3. **run-tests.sh** - Suite Completa de Testes
Executa todas as verificações (requer bash/WSL).

**Uso:**
```bash
bash scripts/run-tests.sh
```

**Executa:**
1. TypeScript type checking
2. ESLint validation
3. Build verification
4. Teste de integridade

---

## 🔧 Como Corrigir Problemas Encontrados

### Problema: Hooks em Conditionals

**Erro encontrado:**
```
Hook chamado dentro de condicional (viola rules of hooks)
```

**Solução:**
```tsx
// ❌ ANTES (ERRADO)
export function MyComponent() {
  if (condition) {
    const [state, setState] = useState('');
  }
}

// ✅ DEPOIS (CORRETO)
export function MyComponent() {
  const [state, setState] = useState('');
  
  if (condition) {
    // usar state aqui
  }
}
```

---

### Problema: Uso de "any" Type

**Erro encontrado:**
```
Uso de "any" type detectado
```

**Solução:**
```tsx
// ❌ ANTES (ERRADO)
const [data, setData] = useState<any>(null);
const handleClick = (e: any) => { };

// ✅ DEPOIS (CORRETO)
import { Order } from '@/types';

const [data, setData] = useState<Order | null>(null);
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { };
```

---

### Problema: Import Não Utilizado

**Erro encontrado:**
```
Import não utilizado: "CategoryFormData"
```

**Solução:**
```tsx
// ❌ ANTES (ERRADO)
import type { CategoryFormData } from '@/types';
// não usar CategoryFormData em nenhum lugar

// ✅ DEPOIS (CORRETO - Opção 1: Remover)
// remover a linha de import

// ✅ DEPOIS (CORRETO - Opção 2: Usar)
const form: CategoryFormData = { ... }
```

---

## 📊 Interpretando Resultados

### Exemplo: Relatório Completo

```
🚀 Iniciando Análise Estática...

🔍 Verificando imports não utilizados...
✅ Verificados 137 arquivos

🔍 Verificando erros de tipagem...
✅ 63 potenciais problemas de tipagem encontrados

🔍 Verificando tratamento de erros...
✅ Verificação de erros concluída (0 problemas)

🔍 Verificando React Hooks Rules...
✅ Verificação de hooks concluída (42 problemas)

🔍 Verificando API routes...
✅ Validadas 37 rotas de API

🔍 Verificando middleware.ts...

🔍 Verificando tipos de banco de dados...
✅ Tipos de banco de dados verificados

🔍 Verificando configurações de build...
✅ Configurações de build verificadas

============================================================
📊 RESUMO DA ANÁLISE ESTÁTICA
============================================================
❌ Erros: 42
⚠️  Avisos: 75
ℹ️  Informações: 3

📝 DETALHES DOS PROBLEMAS:
...
```

### Interpretação:

| Métrica | Significado | Ação |
|---------|------------|------|
| **Erros** | Problemas críticos que devem ser corrigidos | Corrigir antes de deploy |
| **Avisos** | Problemas que podem causar bugs ou performance | Corrigir quando possível |
| **Informações** | TODOs ou pontos de melhoria | Revisar em próximas sprints |

---

## 🚀 Fluxo de Trabalho Recomendado

### 1. Análise Inicial
```bash
npx tsx scripts/analyze-architecture.ts > analysis_report.txt
```

### 2. Revisar Problemas Críticos
```bash
# Verificar ERROS primeiro
grep -i "error" analysis_report.txt
```

### 3. Começar Correções
- Atacar erros por arquivo
- Remover hooks de conditionals
- Remover "any" types
- Limpar imports

### 4. Validar Correções
```bash
npx tsx scripts/analyze-architecture.ts
```

### 5. Testar Endpoints
```bash
# Iniciar o servidor em outro terminal
npm run dev

# Em outro terminal, rodar testes
npx tsx scripts/test-architecture.ts
```

### 6. Build Final
```bash
npm run build
npm run type-check
npm run lint
```

---

## 🐛 Troubleshooting

### Erro: "npm command not found"
```bash
# Verificar instalação do Node.js
node --version

# Reinstalar dependencies
npm install
```

### Erro: "tsx not found"
```bash
# Instalar typescript/tsx
npm install --save-dev tsx typescript
```

### Erro: "TypeScript compilation errors"
```bash
# Rodar type check completo
npm run type-check

# Corrigir erros manualmente em cada arquivo
```

### Timeout em testes
```bash
# Aumentar timeout na execução
timeout 60 npx tsx scripts/test-architecture.ts
```

---

## 📈 Monitorando Progresso

### Criar um histórico de análises

```bash
# Criar diretório para histórico
mkdir -p .analysis-history

# Gerar relatório com timestamp
npx tsx scripts/analyze-architecture.ts > .analysis-history/report-$(date +%Y%m%d-%H%M%S).txt
```

### Comparar dois relatórios

```bash
diff .analysis-history/report-20251201-100000.txt \
     .analysis-history/report-20251201-150000.txt
```

---

## 📞 Suporte

Se encontrar problemas:

1. Verificar `ARCHITECTURE_DEBUG_REPORT.md`
2. Consultar documentação do Projeto: `docs/arquitetura.md`
3. Revisar schema do Prisma: `prisma/schema.prisma`
4. Verificar tipos: `src/types/index.ts`

---

**Última atualização:** 2025-12-01
