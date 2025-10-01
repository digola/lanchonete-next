# 🔍 Guia de Debug - Staff não Adiciona Produtos

## Problema Relatado
Staff consegue selecionar mesa mas não consegue adicionar produtos e criar pedidos.

## Fluxo Esperado
1. Staff faz login → `/staff`
2. Seleciona mesa livre → redireciona para `/?tableId=${tableId}`
3. Adiciona produtos ao carrinho
4. Vai para `/cart?tableId=${tableId}`
5. Finaliza pedido → API cria pedido com tableId
6. Mesa é atualizada para OCUPADA

## Como Testar

### 1. Executar Script de Debug no Console

1. Abra o navegador em `http://localhost:3000`
2. Faça login como STAFF
3. Abra o Console do Navegador (F12 → Console)
4. Cole o conteúdo do arquivo `test-staff-order-flow.js`
5. Pressione Enter

### 2. O que o Script Verifica

✅ **Token de autenticação presente**
✅ **Role do usuário é STAFF/ADMIN**
✅ **Mesas disponíveis existem**
✅ **Produtos disponíveis existem**
✅ **Criação de pedido com tableId**
✅ **Mesa atualizada para OCUPADA**

### 3. Possíveis Problemas Identificados

#### A) Problema de Permissão (403)
```
❌ FALHA ao criar pedido!
   Erro: Permissão insuficiente
```
**Solução**: Verificar permissões em `src/lib/auth.ts` linha 204-215

#### B) Problema de Validação (400)
```
❌ FALHA ao criar pedido!
   Erro: Itens do pedido são obrigatórios
```
**Solução**: Verificar se o carrinho está enviando dados corretos

#### C) Problema de Mesa (404)
```
❌ FALHA ao criar pedido!
   Erro: Mesa não encontrada
```
**Solução**: Verificar se tableId está sendo passado corretamente

## Verificações Manuais

### 1. Verificar Permissões do STAFF

Abra `src/lib/auth.ts` e confirme que o STAFF tem:
```typescript
[UserRole.STAFF]: [
  'orders:create',  // ← DEVE ESTAR PRESENTE
  'orders:update',
  'orders:write',
  // ...
],
```

### 2. Verificar Fluxo na Página Principal

Abra o console na página `/?tableId=ALGUM_ID` e verifique:
- `console.log` mostra tableId?
- Dados da mesa são carregados?
- Botão do carrinho tem tableId na URL?

### 3. Verificar Fluxo no Carrinho

Abra o console na página `/cart?tableId=ALGUM_ID` e verifique:
- TableId está nos searchParams?
- Dados da mesa são exibidos?
- Payload do pedido inclui tableId?

## Logs Esperados

### ✅ SUCESSO
```
🧪 === TESTE DE FLUXO DO STAFF ===

1️⃣ Verificando autenticação...
   Token presente: true

2️⃣ Verificando dados do usuário...
   Usuário: Staff User
   Role: STAFF

3️⃣ Buscando mesas disponíveis...
   Status: 200
   Mesas livres: 3

4️⃣ Buscando produtos disponíveis...
   Status: 200
   Produtos encontrados: 5

5️⃣ Criando pedido...
   Status da resposta: 200

✅ SUCESSO! Pedido criado com ID: xxx

6️⃣ Verificando status da mesa...
   Status da mesa: OCUPADA

🎉 TESTE COMPLETO! Mesa atualizada corretamente.
```

### ❌ FALHA - Sem Permissão
```
5️⃣ Criando pedido...
   Status da resposta: 403
   Erro: Permissão insuficiente

🔍 PROBLEMA DE PERMISSÃO detectado!
```

### ❌ FALHA - Mesa Não Encontrada
```
5️⃣ Criando pedido...
   Status da resposta: 400
   Erro: Mesa não encontrada
```

## Correções Possíveis

### Se o problema for PERMISSÃO:

Edite `src/lib/auth.ts`:
```typescript
[UserRole.STAFF]: [
  'menu:read',
  'orders:read',
  'orders:create',    // ← Adicionar se não existir
  'orders:update',
  'orders:write',
  'products:read',
  'profile:read',
  'profile:write',
  'tables:read',
  'tables:write',
],
```

### Se o problema for CARRINHO:

Verifique em `src/app/cart/page.tsx` linha 82-96:
- `tableId` está sendo incluído no orderData?
- Condição `isStaff && tableId` está correta?

### Se o problema for NAVEGAÇÃO:

Verifique em `src/app/page.tsx` linha 125:
- Link do carrinho inclui tableId quando é staff?
```typescript
href={isStaff && tableId ? `/cart?tableId=${tableId}` : '/cart'}
```

## Próximos Passos

1. Execute o script `test-staff-order-flow.js`
2. Anote qual erro aparece
3. Siga a seção de Correções Possíveis
4. Teste novamente no navegador manualmente

