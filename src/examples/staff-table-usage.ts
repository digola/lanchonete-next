/**
 * Exemplo de Uso do Algoritmo de Gerenciamento de Mesa e Pedidos
 * 
 * Este arquivo demonstra como usar o algoritmo em diferentes cenários
 */

import { OrderTableAPI, OrderCreationData } from '@/lib/order-table-manager';

/**
 * EXEMPLO 1: Fluxo Completo de Criação de Pedido
 */
export async function exemploFluxoCompleto() {
  console.log('🚀 EXEMPLO 1: Fluxo Completo de Criação de Pedido');
  
  const staffUserId = 'staff_user_123';
  const tableId = 'table_789';
  
  try {
    // 1. Selecionar mesa
    console.log('\n1️⃣ Selecionando mesa...');
    const tableSelection = await OrderTableAPI.selectTable(tableId, staffUserId);
    
    if (!tableSelection.success) {
      console.error('❌ Erro ao selecionar mesa:', tableSelection.error);
      return;
    }
    
    console.log('✅ Mesa selecionada:', tableSelection.data);
    
    // 2. Criar pedido
    console.log('\n2️⃣ Criando pedido...');
    const orderData: OrderCreationData = {
      items: [
        { productId: 'prod_123', quantity: 2, price: 15.50 },
        { productId: 'prod_456', quantity: 1, price: 8.00 }
      ],
      tableId: tableId,
      notes: 'Sem cebola no hambúrguer',
      staffUserId: staffUserId
    };
    
    const orderCreation = await OrderTableAPI.createOrder(orderData);
    
    if (!orderCreation.success) {
      console.error('❌ Erro ao criar pedido:', orderCreation.error);
      return;
    }
    
    console.log('✅ Pedido criado:', orderCreation.data);
    
    // 3. Processar pagamento (cliente escolhe como pagar)
    console.log('\n3️⃣ Processando pagamento...');
    const payment = await OrderTableAPI.processPayment(
      orderCreation.data.id, 
      'DINHEIRO',  // Cliente escolheu dinheiro
      39.00        // Valor exato
    );
    
    if (payment.success) {
      console.log('✅ Pagamento processado:', payment.data);
    }
    
    // 4. Verificar estado da mesa
    console.log('\n4️⃣ Verificando estado da mesa...');
    const tableState = await OrderTableAPI.getState(tableId);
    
    if (tableState.success) {
      console.log('📊 Estado da mesa:', tableState.data);
    }
    
  } catch (error) {
    console.error('❌ Erro no fluxo completo:', error);
  }
}

/**
 * EXEMPLO 2: Gerenciamento de Pedido Único por Mesa
 */
export async function exemploPedidoUnico() {
  console.log('\n🚀 EXEMPLO 2: Gerenciamento de Pedido Único por Mesa');
  
  const staffUserId = 'staff_user_123';
  const tableId = 'table_789';
  
  try {
    // Criar pedido
    console.log('\n📝 Criando pedido...');
    const pedido = await OrderTableAPI.createOrder({
      items: [
        { productId: 'prod_123', quantity: 1, price: 15.50 },
        { productId: 'prod_456', quantity: 2, price: 8.00 }
      ],
      tableId: tableId,
      staffUserId: staffUserId
    });
    
    console.log('✅ Pedido criado:', pedido.data?.id);
    
    // Verificar estado da mesa
    const tableState = await OrderTableAPI.getState(tableId);
    console.log('📊 Mesa com pedido ativo:', tableState.data);
    
    // Tentar criar segundo pedido na mesma mesa (deve falhar)
    console.log('\n📝 Tentando criar segundo pedido na mesma mesa...');
    const pedido2 = await OrderTableAPI.createOrder({
      items: [{ productId: 'prod_789', quantity: 1, price: 12.00 }],
      tableId: tableId,
      staffUserId: staffUserId
    });
    
    if (!pedido2.success) {
      console.log('❌ Erro esperado:', pedido2.error);
    }
    
    // Processar pagamento
    console.log('\n💳 Processando pagamento...');
    const pagamento = await OrderTableAPI.processPayment(
      pedido.data?.id,
      'DINHEIRO',
      31.50
    );
    
    if (pagamento.success) {
      console.log('✅ Pagamento processado');
    }
    
    // Marcar como recebido
    console.log('\n📦 Marcando pedido como recebido...');
    const recebido = await OrderTableAPI.markAsReceived(pedido.data?.id);
    
    if (recebido.success) {
      console.log('✅ Pedido recebido');
      
      // Verificar se mesa foi liberada
      const estadoFinal = await OrderTableAPI.checkStatus(tableId);
      console.log('📊 Mesa após receber pedido:', estadoFinal.data);
    }
    
  } catch (error) {
    console.error('❌ Erro no exemplo de pedido único:', error);
  }
}

/**
 * EXEMPLO 3: Adicionar Produtos ao Pedido Ativo
 */
export async function exemploAdicionarProdutos() {
  console.log('\n🚀 EXEMPLO 3: Adicionar Produtos ao Pedido Ativo');
  
  const staffUserId = 'staff_user_123';
  const tableId = 'table_789';
  
  try {
    // 1. Criar pedido inicial
    console.log('\n📝 Criando pedido inicial...');
    const pedidoInicial = await OrderTableAPI.createOrder({
      items: [
        { productId: 'prod_123', quantity: 1, price: 15.50 }
      ],
      tableId: tableId,
      staffUserId: staffUserId
    });
    
    console.log('✅ Pedido inicial criado:', pedidoInicial.data?.id);
    console.log('💰 Total inicial:', pedidoInicial.data?.total);
    
    // 2. Adicionar mais produtos ao pedido ativo
    console.log('\n🛒 Adicionando produtos ao pedido ativo...');
    const produtosAdicionais = [
      { productId: 'prod_456', quantity: 2, price: 8.00, notes: 'Sem cebola' },
      { productId: 'prod_789', quantity: 1, price: 12.00 }
    ];
    
    const adicionarProdutos = await OrderTableAPI.addProductsToOrder(tableId, produtosAdicionais);
    
    if (adicionarProdutos.success) {
      console.log('✅ Produtos adicionados com sucesso!');
      console.log('💰 Novo total:', adicionarProdutos.data?.total);
      console.log('📦 Itens no pedido:', adicionarProdutos.data?.items?.length);
    } else {
      console.log('❌ Erro ao adicionar produtos:', adicionarProdutos.error);
    }
    
    // 3. Tentar adicionar produtos em mesa sem pedido ativo
    console.log('\n🛒 Tentando adicionar produtos em mesa sem pedido ativo...');
    const mesaVazia = await OrderTableAPI.addProductsToOrder('table_sem_pedido', [
      { productId: 'prod_123', quantity: 1, price: 15.50 }
    ]);
    
    if (!mesaVazia.success) {
      console.log('❌ Erro esperado:', mesaVazia.error);
    }
    
    // 4. Verificar estado final da mesa
    console.log('\n📊 Verificando estado final da mesa...');
    const estadoFinal = await OrderTableAPI.getState(tableId);
    
    if (estadoFinal.success) {
      console.log('📊 Estado da mesa:', estadoFinal.data);
    }
    
  } catch (error) {
    console.error('❌ Erro no exemplo de adicionar produtos:', error);
  }
}

/**
 * EXEMPLO 4: Cancelamento de Pedidos
 */
export async function exemploCancelamento() {
  console.log('\n🚀 EXEMPLO 3: Cancelamento de Pedidos');
  
  const staffUserId = 'staff_user_123';
  const tableId = 'table_789';
  
  try {
    // Criar pedido
    console.log('\n📝 Criando pedido para cancelar...');
    const pedido = await OrderTableAPI.createOrder({
      items: [{ productId: 'prod_123', quantity: 1, price: 15.50 }],
      tableId: tableId,
      staffUserId: staffUserId
    });
    
    console.log('✅ Pedido criado:', pedido.data?.id);
    
    // Verificar estado da mesa
    const estadoInicial = await OrderTableAPI.checkStatus(tableId);
    console.log('📊 Mesa ocupada:', estadoInicial.data);
    
    // Cancelar pedido
    console.log('\n❌ Cancelando pedido...');
    const cancelado = await OrderTableAPI.cancelOrder(pedido.data?.id);
    
    if (cancelado.success) {
      console.log('✅ Pedido cancelado');
      
      // Verificar se mesa foi liberada
      const estadoFinal = await OrderTableAPI.checkStatus(tableId);
      console.log('📊 Mesa após cancelamento:', estadoFinal.data);
    }
    
  } catch (error) {
    console.error('❌ Erro no exemplo de cancelamento:', error);
  }
}

/**
 * EXEMPLO 4: Verificação de Status e Correção
 */
export async function exemploVerificacaoStatus() {
  console.log('\n🚀 EXEMPLO 4: Verificação de Status e Correção');
  
  const tableId = 'table_789';
  
  try {
    // Verificar status atual da mesa
    console.log('\n🔍 Verificando status da mesa...');
    const statusCheck = await OrderTableAPI.checkStatus(tableId);
    
    if (statusCheck.success && statusCheck.data) {
      const { table, activeOrders, shouldBeOccupied, statusMatches } = statusCheck.data;
      
      console.log('📊 Status da mesa:', table.status);
      console.log('📊 Pedidos ativos:', activeOrders.length);
      console.log('📊 Deveria estar ocupada:', shouldBeOccupied);
      console.log('📊 Status está correto:', statusMatches);
      
      // Se status não está correto, corrigir
      if (!statusMatches) {
        console.log('\n🔧 Corrigindo status da mesa...');
        
        if (shouldBeOccupied && table.status === 'LIVRE') {
          // Mesa deveria estar ocupada mas está livre
          console.log('⚠️ Mesa deveria estar ocupada mas está livre');
          // Aqui você poderia implementar uma lógica de correção
        } else if (!shouldBeOccupied && table.status === 'OCUPADA') {
          // Mesa deveria estar livre mas está ocupada
          console.log('⚠️ Mesa deveria estar livre mas está ocupada');
          const liberacao = await OrderTableAPI.releaseTable(tableId);
          if (liberacao.success) {
            console.log('✅ Mesa liberada manualmente');
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação de status:', error);
  }
}

/**
 * EXEMPLO 5: Cenário de Erro e Recuperação
 */
export async function exemploCenarioErro() {
  console.log('\n🚀 EXEMPLO 5: Cenário de Erro e Recuperação');
  
  const staffUserId = 'staff_user_123';
  const tableId = 'table_inexistente';
  
  try {
    // Tentar selecionar mesa inexistente
    console.log('\n🪑 Tentando selecionar mesa inexistente...');
    const selecao = await OrderTableAPI.selectTable(tableId, staffUserId);
    
    if (!selecao.success) {
      console.log('❌ Erro esperado:', selecao.error);
    }
    
    // Tentar criar pedido sem mesa
    console.log('\n📝 Tentando criar pedido sem mesa...');
    const pedido = await OrderTableAPI.createOrder({
      items: [{ productId: 'prod_123', quantity: 1, price: 15.50 }],
      tableId: '',
      staffUserId: staffUserId
    });
    
    if (!pedido.success) {
      console.log('❌ Erro esperado:', pedido.error);
    }
    
    // Tentar marcar pedido inexistente como recebido
    console.log('\n📦 Tentando marcar pedido inexistente como recebido...');
    const recebido = await OrderTableAPI.markAsReceived('pedido_inexistente');
    
    if (!recebido.success) {
      console.log('❌ Erro esperado:', recebido.error);
    }
    
  } catch (error) {
    console.error('❌ Erro no exemplo de cenário de erro:', error);
  }
}

/**
 * Função para executar todos os exemplos
 */
export async function executarTodosExemplos() {
  console.log('🎯 EXECUTANDO TODOS OS EXEMPLOS DO ALGORITMO DE MESA E PEDIDOS');
  console.log('=' .repeat(80));
  
  await exemploFluxoCompleto();
  await exemploPedidoUnico();
  await exemploAdicionarProdutos();
  await exemploCancelamento();
  await exemploVerificacaoStatus();
  await exemploCenarioErro();
  
  console.log('\n🎉 TODOS OS EXEMPLOS EXECUTADOS COM SUCESSO!');
}

// Funções já estão exportadas individualmente acima
