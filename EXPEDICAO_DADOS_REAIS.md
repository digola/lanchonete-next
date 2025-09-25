# 🚀 **Implementação: /expedicao com Dados Reais do Banco**

## 📋 **Status Atual**

**Página**: `/expedicao`  
**Status**: ⚠️ **USANDO DADOS SIMULADOS**  
**Prioridade**: 🔴 **ALTA**  
**Estimativa**: 2-3 dias

---

## 🎯 **Objetivo**

Conectar a página de expedição com dados reais do banco de dados, substituindo os dados simulados por dados reais de pedidos, mesas e produtos.

---

## 🔍 **Análise Atual**

### **Dados Simulados Identificados**
```typescript
// src/app/expedicao/page.tsx
const mockOrders = [
  {
    id: 'order-1',
    tableNumber: 5,
    customerName: 'João Silva',
    items: [
      { name: 'Hambúrguer', quantity: 2, price: 25.90 },
      { name: 'Batata Frita', quantity: 1, price: 12.50 }
    ],
    total: 64.30,
    status: 'PREPARANDO',
    createdAt: new Date(),
    estimatedTime: 15
  }
];
```

### **APIs Reais Disponíveis**
- ✅ `GET /api/orders` - Listar pedidos
- ✅ `GET /api/tables` - Listar mesas
- ✅ `GET /api/products` - Listar produtos
- ✅ `PUT /api/orders/[id]` - Atualizar status do pedido
- ✅ `PUT /api/tables/[id]` - Atualizar status da mesa

---

## 🛠️ **Plano de Implementação**

### **Fase 1: Conectar APIs Reais (Dia 1)**

#### **1.1 Substituir dados simulados por APIs reais**
```typescript
// Implementar hooks para dados reais
const { orders, loading: ordersLoading, error: ordersError } = useApi('/api/orders');
const { tables, loading: tablesLoading, error: tablesError } = useApi('/api/tables');
const { products, loading: productsLoading, error: productsError } = useApi('/api/products');
```

#### **1.2 Implementar estados de loading**
```typescript
// Estados de loading para cada seção
const [ordersLoading, setOrdersLoading] = useState(true);
const [tablesLoading, setTablesLoading] = useState(true);
const [productsLoading, setProductsLoading] = useState(true);
```

#### **1.3 Implementar tratamento de erros**
```typescript
// Tratamento de erros para cada API
if (ordersError) {
  console.error('Erro ao carregar pedidos:', ordersError);
  // Mostrar mensagem de erro para o usuário
}
```

### **Fase 2: Implementar Atualizações em Tempo Real (Dia 2)**

#### **2.1 WebSocket para pedidos**
```typescript
// Implementar WebSocket para atualizações em tempo real
const { isConnected, sendMessage } = useWebSocket('/ws/expedicao');

useEffect(() => {
  if (isConnected) {
    // Escutar atualizações de pedidos
    sendMessage({ type: 'SUBSCRIBE_ORDERS' });
  }
}, [isConnected]);
```

#### **2.2 Atualizações automáticas**
```typescript
// Atualizar pedidos automaticamente
useEffect(() => {
  const interval = setInterval(() => {
    if (isConnected) {
      // Buscar atualizações de pedidos
      fetchOrders();
    }
  }, 5000); // Atualizar a cada 5 segundos

  return () => clearInterval(interval);
}, [isConnected]);
```

### **Fase 3: Implementar Funcionalidades de Gestão (Dia 3)**

#### **3.1 Atualizar status de pedidos**
```typescript
// Função para atualizar status do pedido
const updateOrderStatus = async (orderId: string, newStatus: string) => {
  try {
    const response = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (response.ok) {
      // Atualizar lista de pedidos
      fetchOrders();
      // Notificar sucesso
      showNotification('Status do pedido atualizado!');
    }
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    showNotification('Erro ao atualizar pedido', 'error');
  }
};
```

#### **3.2 Gerenciar mesas**
```typescript
// Função para atualizar status da mesa
const updateTableStatus = async (tableId: string, newStatus: string) => {
  try {
    const response = await fetch(`/api/tables/${tableId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (response.ok) {
      // Atualizar lista de mesas
      fetchTables();
      // Notificar sucesso
      showNotification('Status da mesa atualizado!');
    }
  } catch (error) {
    console.error('Erro ao atualizar mesa:', error);
    showNotification('Erro ao atualizar mesa', 'error');
  }
};
```

---

## 📊 **Estrutura de Dados Real**

### **Pedidos (Orders)**
```typescript
interface Order {
  id: string;
  userId: string;
  status: 'PENDENTE' | 'CONFIRMADO' | 'PREPARANDO' | 'PRONTO' | 'ENTREGUE' | 'CANCELADO';
  total: number;
  deliveryType: 'RETIRADA' | 'DELIVERY';
  deliveryAddress?: string;
  paymentMethod: 'DINHEIRO' | 'CARTAO';
  notes?: string;
  tableId?: string;
  table?: Table;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}
```

### **Itens do Pedido (OrderItems)**
```typescript
interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  customizations?: string;
  notes?: string;
}
```

### **Mesas (Tables)**
```typescript
interface Table {
  id: string;
  number: number;
  capacity: number;
  status: 'DISPONIVEL' | 'OCUPADA' | 'RESERVADA' | 'MANUTENCAO';
  assignedUserId?: string;
  assignedUser?: User;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔧 **Implementação Técnica**

### **1. Hook para Dados Reais**
```typescript
// src/hooks/useExpedicaoData.ts
export const useExpedicaoData = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders?status=PREPARANDO,PRONTO');
      const data = await response.json();
      setOrders(data.data || []);
    } catch (err) {
      setError('Erro ao carregar pedidos');
    }
  };

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/tables');
      const data = await response.json();
      setTables(data.data || []);
    } catch (err) {
      setError('Erro ao carregar mesas');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?isAvailable=true');
      const data = await response.json();
      setProducts(data.data || []);
    } catch (err) {
      setError('Erro ao carregar produtos');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchOrders(), fetchTables(), fetchProducts()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    orders,
    tables,
    products,
    loading,
    error,
    fetchOrders,
    fetchTables,
    fetchProducts
  };
};
```

### **2. Componente de Pedidos Reais**
```typescript
// src/components/expedicao/OrderCard.tsx
interface OrderCardProps {
  order: Order;
  onUpdateStatus: (orderId: string, status: string) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onUpdateStatus }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMADO': return 'bg-blue-100 text-blue-800';
      case 'PREPARANDO': return 'bg-orange-100 text-orange-800';
      case 'PRONTO': return 'bg-green-100 text-green-800';
      case 'ENTREGUE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg">Pedido #{order.id.slice(-6)}</h3>
          <p className="text-sm text-gray-600">
            {order.table ? `Mesa ${order.table.number}` : 'Delivery'}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
          {order.status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>{item.product.name} x{item.quantity}</span>
            <span className="font-medium">R$ {(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <span className="font-bold text-lg">Total: R$ {order.total.toFixed(2)}</span>
        <div className="space-x-2">
          {order.status === 'PREPARANDO' && (
            <button
              onClick={() => onUpdateStatus(order.id, 'PRONTO')}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
            >
              Marcar Pronto
            </button>
          )}
          {order.status === 'PRONTO' && (
            <button
              onClick={() => onUpdateStatus(order.id, 'ENTREGUE')}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            >
              Marcar Entregue
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
```

### **3. Componente de Mesas Reais**
```typescript
// src/components/expedicao/TableCard.tsx
interface TableCardProps {
  table: Table;
  onUpdateStatus: (tableId: string, status: string) => void;
}

export const TableCard: React.FC<TableCardProps> = ({ table, onUpdateStatus }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DISPONIVEL': return 'bg-green-100 text-green-800';
      case 'OCUPADA': return 'bg-red-100 text-red-800';
      case 'RESERVADA': return 'bg-yellow-100 text-yellow-800';
      case 'MANUTENCAO': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-lg">Mesa {table.number}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(table.status)}`}>
          {table.status}
        </span>
      </div>

      <div className="text-sm text-gray-600 mb-3">
        Capacidade: {table.capacity} pessoas
        {table.assignedUser && (
          <p>Responsável: {table.assignedUser.name}</p>
        )}
      </div>

      <div className="flex space-x-2">
        {table.status === 'DISPONIVEL' && (
          <button
            onClick={() => onUpdateStatus(table.id, 'OCUPADA')}
            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
          >
            Ocupar Mesa
          </button>
        )}
        {table.status === 'OCUPADA' && (
          <button
            onClick={() => onUpdateStatus(table.id, 'DISPONIVEL')}
            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
          >
            Liberar Mesa
          </button>
        )}
      </div>
    </div>
  );
};
```

---

## 🧪 **Testes de Implementação**

### **Teste 1: Carregamento de Dados**
```typescript
// Verificar se os dados estão sendo carregados corretamente
it('deve carregar dados reais da expedição', async () => {
  const { result } = renderHook(() => useExpedicaoData());
  
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
    expect(result.current.orders).toBeDefined();
    expect(result.current.tables).toBeDefined();
    expect(result.current.products).toBeDefined();
  });
});
```

### **Teste 2: Atualização de Status**
```typescript
// Verificar se a atualização de status está funcionando
it('deve atualizar status do pedido', async () => {
  const mockOrder = { id: 'order-1', status: 'PREPARANDO' };
  const { result } = renderHook(() => useExpedicaoData());
  
  await act(async () => {
    await result.current.updateOrderStatus('order-1', 'PRONTO');
  });
  
  expect(mockOrder.status).toBe('PRONTO');
});
```

---

## 📋 **Checklist de Implementação**

### **Dia 1: Conectar APIs**
- [ ] Substituir dados simulados por APIs reais
- [ ] Implementar estados de loading
- [ ] Implementar tratamento de erros
- [ ] Testar carregamento de dados

### **Dia 2: Tempo Real**
- [ ] Implementar WebSocket
- [ ] Implementar atualizações automáticas
- [ ] Testar notificações em tempo real
- [ ] Otimizar performance

### **Dia 3: Funcionalidades**
- [ ] Implementar atualização de status
- [ ] Implementar gestão de mesas
- [ ] Implementar notificações
- [ ] Testes finais

---

## 🎯 **Resultado Esperado**

Após a implementação, a página `/expedicao` terá:

- ✅ **Dados reais** do banco de dados
- ✅ **Atualizações em tempo real** via WebSocket
- ✅ **Gestão de pedidos** funcionando
- ✅ **Gestão de mesas** funcionando
- ✅ **Notificações** para mudanças de status
- ✅ **Performance otimizada** com cache inteligente

**A expedição estará completamente integrada com o sistema real! 🚀**
