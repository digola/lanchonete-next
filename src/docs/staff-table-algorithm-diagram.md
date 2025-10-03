# Algoritmo de Gerenciamento de Mesa e Pedidos - Staff

## 📊 Diagrama de Fluxo

```
┌─────────────────────────────────────────────────────────────────┐
│                    ALGORITMO STAFF MESA/PEDIDO                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  1. SELECIONAR   │    │  2. CRIAR      │    │  3. GERENCIAR   │    │  4. LIBERAR     │
│     MESA        │    │   PEDIDO       │    │   STATUS       │    │     MESA        │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
         │                   │                   │                   │
         ▼                   ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ • Verificar     │ │ • Validar       │ │ • Marcar        │ │ • Verificar     │
│   disponibilidade│ │   produtos      │ │   recebido      │ │   pedidos ativos│
│ • Buscar mesa   │ │ • Calcular      │ │ • Cancelar      │ │ • Liberar se    │
│ • Retornar      │ │   total         │ │ • Finalizar     │ │   necessário    │
│   estado        │ │ • Criar pedido  │ │ • Atualizar     │ │ • Atualizar     │
│                 │ │ • Ocupar mesa   │ │   isActive      │ │   status mesa   │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

## 🔄 Estados do Pedido

```
CRIAÇÃO → ATIVO → RECEBIDO/CANCELADO/FINALIZADO → INATIVO
   │        │              │
   ▼        ▼              ▼
isActive: true    isActive: false
isReceived: false isReceived: true/false
status: CONFIRMADO status: RECEBIDO/CANCELADO/FINALIZADO
```

## 🪑 Estados da Mesa

```
LIVRE → OCUPADA → LIVRE
  │        │        │
  ▼        ▼        ▼
• Sem     • Com     • Sem
  pedidos   pedidos   pedidos
  ativos    ativos    ativos
```

## 📋 Fluxo Detalhado

### 1. Seleção de Mesa
```typescript
selectTable(tableId, staffUserId)
├── Verificar se mesa existe
├── Verificar se está LIVRE
├── Buscar pedidos ativos
└── Retornar estado da mesa
```

### 2. Criação de Pedido
```typescript
createOrder(orderData)
├── Validar produtos
├── Calcular total
├── Criar pedido (isActive: true, isReceived: false)
├── Ocupar mesa (status: OCUPADA)
└── Retornar pedido criado
```

### 3. Marcar como Recebido
```typescript
markOrderAsReceived(orderId)
├── Verificar se pedido existe
├── Marcar isReceived: true
├── Marcar isActive: false
├── Verificar pedidos ativos na mesa
├── Liberar mesa se necessário
└── Retornar pedido atualizado
```

### 4. Cancelar Pedido
```typescript
cancelOrder(orderId)
├── Verificar se pedido existe
├── Marcar status: CANCELADO
├── Marcar isActive: false
├── Verificar pedidos ativos na mesa
├── Liberar mesa se necessário
└── Retornar pedido cancelado
```

## 🎯 Regras de Negócio

### Regra 1: Criação de Pedido
- ✅ Todo pedido começa com `isActive: true`
- ✅ Todo pedido começa com `isReceived: false`
- ✅ Mesa é ocupada automaticamente
- ✅ Mesa é atribuída ao staff

### Regra 2: Recebimento de Pedido
- ✅ `isReceived: true` → `isActive: false` (automático)
- ✅ Mesa é liberada se não há outros pedidos ativos
- ✅ Mesa mantém status OCUPADA se há pedidos ativos

### Regra 3: Cancelamento de Pedido
- ✅ `status: CANCELADO` → `isActive: false`
- ✅ Mesa é liberada se não há outros pedidos ativos
- ✅ Mesa mantém status OCUPADA se há pedidos ativos

### Regra 4: Finalização de Pedido
- ✅ `status: FINALIZADO` → `isActive: false`
- ✅ Mesa é liberada se não há outros pedidos ativos
- ✅ Mesa mantém status OCUPADA se há pedidos ativos

## 🔍 Verificação de Status

### Condições para Mesa OCUPADA
```typescript
const activeOrders = await prisma.order.count({
  where: {
    tableId: tableId,
    isActive: true,  // ← PEDIDOS ATIVOS
    status: {
      notIn: ['CANCELADO', 'ENTREGUE', 'FINALIZADO']
    }
  }
});

const shouldBeOccupied = activeOrders > 0;
```

### Condições para Mesa LIVRE
```typescript
const shouldBeFree = activeOrders === 0;
```

## 🚨 Tratamento de Erros

### Erros Comuns
1. **Mesa não encontrada** → Retornar erro 404
2. **Mesa ocupada** → Retornar erro 400
3. **Produto indisponível** → Retornar erro 400
4. **Pedido já recebido** → Retornar erro 400
5. **Validação de dados** → Retornar erro 400

### Recuperação de Erros
1. **Transação falhou** → Rollback automático
2. **Status inconsistente** → Verificar e corrigir
3. **Mesa travada** → Liberar manualmente

## 📊 Exemplo Prático

### Cenário: Staff cria 2 pedidos na mesma mesa

```
10:30 - Criar Pedido A
├── Pedido A: isActive=true, isReceived=false
├── Mesa: status=OCUPADA, assignedTo=staff_123
└── Estado: 1 pedido ativo

10:45 - Criar Pedido B
├── Pedido A: isActive=true, isReceived=false
├── Pedido B: isActive=true, isReceived=false
├── Mesa: status=OCUPADA, assignedTo=staff_123
└── Estado: 2 pedidos ativos

11:00 - Receber Pedido A
├── Pedido A: isActive=false, isReceived=true
├── Pedido B: isActive=true, isReceived=false
├── Mesa: status=OCUPADA, assignedTo=staff_123
└── Estado: 1 pedido ativo (B)

11:15 - Receber Pedido B
├── Pedido A: isActive=false, isReceived=true
├── Pedido B: isActive=false, isReceived=true
├── Mesa: status=LIVRE, assignedTo=null
└── Estado: 0 pedidos ativos → MESA LIBERADA
```

## 🛠️ APIs Disponíveis

### StaffTableAPI
- `selectTable(tableId, staffUserId)` - Selecionar mesa
- `createOrder(orderData)` - Criar pedido
- `markAsReceived(orderId)` - Marcar como recebido
- `cancelOrder(orderId)` - Cancelar pedido
- `checkStatus(tableId)` - Verificar status
- `releaseTable(tableId)` - Liberar mesa
- `getState(tableId)` - Obter estado completo

## 🎯 Vantagens do Algoritmo

1. **Consistência**: Transações garantem integridade
2. **Automação**: Mesa liberada automaticamente
3. **Flexibilidade**: Suporta múltiplos pedidos
4. **Robustez**: Tratamento de erros completo
5. **Rastreabilidade**: Logs detalhados
6. **Manutenibilidade**: Código organizado e testável

