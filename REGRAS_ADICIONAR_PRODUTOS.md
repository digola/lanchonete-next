# 📋 Regras para Adicionar Produtos aos Pedidos

## 🎯 Objetivo

Permitir que **STAFF e MANAGER** possam adicionar produtos aos pedidos **a qualquer momento**, enquanto **CLIENTES** têm restrições.

---

## ✅ Regras Implementadas

### 👤 **STAFF e MANAGER** (Permissão Total)

Podem adicionar produtos em **TODOS os status ativos**:

| Status | Pode Adicionar? | Motivo |
|--------|-----------------|--------|
| PENDENTE | ✅ Sim | Pedido ainda não iniciado |
| CONFIRMADO | ✅ Sim | Pedido confirmado, mas não em preparo |
| PREPARANDO | ✅ Sim | **NOVO!** Pode adicionar durante preparo |
| PRONTO | ✅ Sim | **NOVO!** Pode adicionar quando pronto |
| ENTREGUE | ❌ Não | Pedido já foi entregue e pago |
| CANCELADO | ❌ Não | Pedido cancelado |

### 🧑‍💼 **CUSTOMER (Cliente)**

Restrição para evitar mudanças após o pedido estar em preparo:

| Status | Pode Adicionar? | Motivo |
|--------|-----------------|--------|
| PENDENTE | ✅ Sim | Pedido ainda não confirmado |
| CONFIRMADO | ✅ Sim | Pedido confirmado, mas não iniciado |
| PREPARANDO | ❌ Não | Já está sendo preparado |
| PRONTO | ❌ Não | Já está pronto |
| ENTREGUE | ❌ Não | Pedido finalizado |
| CANCELADO | ❌ Não | Pedido cancelado |

---

## 🔧 Implementação Técnica

### API: `/api/orders/[id]/items` (PUT)

```typescript
// Verificar role do usuário
const isStaffOrManager = decoded.role === UserRole.STAFF || 
                         decoded.role === UserRole.ADMIN || 
                         decoded.role === UserRole.MANAGER;

if (isStaffOrManager) {
  // Staff/Manager: Pode adicionar em qualquer status ativo
  const invalidStatuses = ['ENTREGUE', 'CANCELADO'];
  if (invalidStatuses.includes(existingOrder.status)) {
    return error('Pedido finalizado');
  }
} else {
  // Cliente: Só pode adicionar em PENDENTE ou CONFIRMADO
  const validStatuses = ['PENDENTE', 'CONFIRMADO'];
  if (!validStatuses.includes(existingOrder.status)) {
    return error('Pedido em preparo');
  }
}
```

---

## 📊 Fluxo de Uso

### Cenário 1: Cliente Adiciona Produto
```
1. Cliente cria pedido → CONFIRMADO
2. Cliente pode adicionar mais produtos → ✅ OK
3. Staff inicia preparo → PREPARANDO
4. Cliente tenta adicionar → ❌ BLOQUEADO
   Mensagem: "Não é possível adicionar itens a um pedido em preparo"
```

### Cenário 2: Staff Adiciona Produto (Qualquer Momento)
```
1. Cliente cria pedido → CONFIRMADO
2. Staff inicia preparo → PREPARANDO
3. Cliente pede mais item verbalmente
4. Staff adiciona produto ao pedido → ✅ OK
5. Pedido fica pronto → PRONTO
6. Cliente lembra de mais um item
7. Staff adiciona produto → ✅ OK
8. Total é recalculado automaticamente
```

### Cenário 3: Mesa com Pedido Pronto
```
1. Pedido está PRONTO na mesa
2. Cliente pede mais algo
3. Staff pode:
   - Opção A: Adicionar ao pedido existente → ✅ OK
   - Opção B: Criar novo pedido para a mesa → ✅ OK
```

---

## 🧪 Como Testar

### Teste 1: Staff Adiciona em PREPARANDO
1. Faça login como **STAFF**
2. Acesse `/tables/[id]` com pedido CONFIRMADO
3. Clique em "Iniciar Preparo" → Status vira PREPARANDO
4. Clique em "Adicionar Produtos"
5. Selecione produtos e adicione
6. ✅ **Deve funcionar!**

### Teste 2: Staff Adiciona em PRONTO
1. Com pedido em PREPARANDO
2. Clique em "Marcar Pronto" → Status vira PRONTO
3. Clique em "Adicionar Produtos"
4. Selecione produtos e adicione
5. ✅ **Deve funcionar!**

### Teste 3: Staff NÃO Pode Adicionar em ENTREGUE
1. Com pedido em PRONTO
2. Clique em "Entregar" → Status vira ENTREGUE
3. Tente adicionar produtos
4. ❌ **Deve bloquear com mensagem**

### Teste 4: Cliente NÃO Pode Adicionar em PREPARANDO
1. Faça login como **CLIENTE**
2. Crie um pedido → CONFIRMADO
3. (Staff muda para PREPARANDO)
4. Cliente tenta adicionar produtos
5. ❌ **Deve bloquear com mensagem**

---

## 🎨 Interface do Usuário

### Botão "Adicionar Produtos" - Quando Aparece?

**Para STAFF/MANAGER:**
```typescript
// Mostra botão se pedido NÃO está ENTREGUE ou CANCELADO
const canAddProducts = !['ENTREGUE', 'CANCELADO'].includes(order.status);

{canAddProducts && (
  <Button onClick={() => setShowAddProducts(order.id)}>
    <Plus /> Adicionar Produtos
  </Button>
)}
```

**Para CLIENTE:**
```typescript
// Mostra botão apenas em PENDENTE ou CONFIRMADO
const canAddProducts = ['PENDENTE', 'CONFIRMADO'].includes(order.status);
```

---

## 💡 Casos de Uso Reais

### Caso 1: Mesa Pede Mais Durante a Refeição
```
Situação: Clientes já receberam alguns pratos (PRONTO/ENTREGUE)
         e querem pedir mais itens

Solução: 
- ANTES: ❌ Tinha que criar novo pedido
- AGORA: ✅ Staff adiciona ao pedido existente em PRONTO
```

### Caso 2: Esqueceram de Pedir Algo
```
Situação: Pedido já está na cozinha (PREPARANDO)
         e cliente lembra de mais algo

Solução:
- ANTES: ❌ Bloqueado, tinha que criar novo pedido
- AGORA: ✅ Staff adiciona direto ao pedido em preparo
```

### Caso 3: Ajuste de Última Hora
```
Situação: Pedido está PRONTO esperando ser servido
         e cliente quer adicionar bebida

Solução:
- ANTES: ❌ Bloqueado
- AGORA: ✅ Staff adiciona bebida ao pedido pronto
         Total é recalculado automaticamente
```

---

## 🔒 Segurança e Validações

### O que NÃO Mudou (Mantém Segurança)

1. ✅ **Autenticação obrigatória** - Precisa de token
2. ✅ **Verificação de permissões** - Só STAFF/MANAGER/Owner
3. ✅ **Validação de produtos** - Produtos precisam existir e estar disponíveis
4. ✅ **Recálculo automático** - Total sempre correto
5. ✅ **Pedidos finalizados protegidos** - ENTREGUE/CANCELADO bloqueados

### O que Mudou (Mais Flexibilidade)

1. ✨ **STAFF pode adicionar em PREPARANDO**
2. ✨ **STAFF pode adicionar em PRONTO**
3. ✨ **MANAGER tem mesmas permissões que STAFF**
4. ✨ **Cliente ainda tem restrições de segurança**

---

## 📝 Arquivos Modificados

- ✅ `src/app/api/orders/[id]/items/route.ts` - Regras de permissão ajustadas
- ✅ Diferenciação entre STAFF/MANAGER e CUSTOMER
- ✅ Validação baseada em role e status do pedido

---

## 🎯 Resultado Final

### ❌ Antes
```
STAFF só podia adicionar em: PENDENTE, CONFIRMADO, PRONTO
PREPARANDO: ❌ BLOQUEADO
```

### ✅ Agora
```
STAFF pode adicionar em: PENDENTE, CONFIRMADO, PREPARANDO, PRONTO
Apenas ENTREGUE e CANCELADO: ❌ BLOQUEADO
```

---

## 🚀 Benefícios

1. ✅ **Maior flexibilidade** - Staff pode ajustar pedidos a qualquer momento
2. ✅ **Melhor atendimento** - Sem criar múltiplos pedidos para mesma mesa
3. ✅ **Total sempre correto** - Recalculado automaticamente
4. ✅ **Segurança mantida** - Clientes ainda têm restrições
5. ✅ **Pedidos finalizados protegidos** - Não permite mudança após entrega

---

**Agora STAFF e MANAGER têm controle total sobre pedidos ativos! 🎉**

