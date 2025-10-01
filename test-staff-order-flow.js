// Script de teste para verificar o fluxo completo do STAFF
// Execute este script no console do navegador quando estiver logado como STAFF

const testStaffOrderFlow = async () => {
  console.log('🧪 === TESTE DE FLUXO DO STAFF ===\n');

  // 1. Verificar autenticação
  console.log('1️⃣ Verificando autenticação...');
  const token = localStorage.getItem('auth-token');
  console.log('   Token presente:', !!token);
  console.log('   Token:', token?.substring(0, 20) + '...\n');

  if (!token) {
    console.error('❌ Token não encontrado. Faça login primeiro!');
    return;
  }

  // 2. Verificar dados do usuário
  console.log('2️⃣ Verificando dados do usuário...');
  const userDataStr = localStorage.getItem('auth-user');
  const userData = userDataStr ? JSON.parse(userDataStr) : null;
  console.log('   Usuário:', userData?.name);
  console.log('   Role:', userData?.role);
  console.log('   ID:', userData?.id, '\n');

  if (userData?.role !== 'STAFF' && userData?.role !== 'ADMIN') {
    console.error('❌ Usuário não é STAFF ou ADMIN!');
    return;
  }

  // 3. Buscar mesas disponíveis
  console.log('3️⃣ Buscando mesas disponíveis...');
  try {
    const tablesResponse = await fetch('/api/tables', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const tablesData = await tablesResponse.json();
    console.log('   Status:', tablesResponse.status);
    console.log('   Mesas encontradas:', tablesData?.data?.length || 0);
    
    const mesasLivres = tablesData?.data?.filter(t => t.status === 'LIVRE') || [];
    console.log('   Mesas livres:', mesasLivres.length);
    
    if (mesasLivres.length === 0) {
      console.error('❌ Nenhuma mesa livre disponível!');
      return;
    }

    const primeiraMesaLivre = mesasLivres[0];
    console.log('   Usando mesa:', primeiraMesaLivre.number, '(ID:', primeiraMesaLivre.id + ')\n');

    // 4. Buscar produtos disponíveis
    console.log('4️⃣ Buscando produtos disponíveis...');
    const productsResponse = await fetch('/api/products?isAvailable=true&limit=5');
    const productsData = await productsResponse.json();
    console.log('   Status:', productsResponse.status);
    console.log('   Produtos encontrados:', productsData?.data?.length || 0);
    
    if (!productsData?.data || productsData.data.length === 0) {
      console.error('❌ Nenhum produto disponível!');
      return;
    }

    const primeiroProduto = productsData.data[0];
    console.log('   Usando produto:', primeiroProduto.name);
    console.log('   Preço:', primeiroProduto.price, '\n');

    // 5. Criar pedido
    console.log('5️⃣ Criando pedido...');
    const orderData = {
      items: [
        {
          productId: primeiroProduto.id,
          quantity: 1,
          price: primeiroProduto.price
        }
      ],
      tableId: primeiraMesaLivre.id,
      paymentMethod: 'DINHEIRO',
      notes: 'Teste de pedido do STAFF',
      total: primeiroProduto.price
    };

    console.log('   Dados do pedido:', JSON.stringify(orderData, null, 2));

    const orderResponse = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });

    console.log('   Status da resposta:', orderResponse.status);
    const orderResult = await orderResponse.json();
    console.log('   Resultado:', JSON.stringify(orderResult, null, 2));

    if (orderResponse.ok) {
      console.log('\n✅ SUCESSO! Pedido criado com ID:', orderResult.data?.id);
      
      // 6. Verificar se a mesa foi atualizada
      console.log('\n6️⃣ Verificando status da mesa...');
      const mesaResponse = await fetch(`/api/tables/${primeiraMesaLivre.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const mesaData = await mesaResponse.json();
      console.log('   Status da mesa:', mesaData.data?.status);
      console.log('   Atribuída a:', mesaData.data?.assignedTo);
      
      if (mesaData.data?.status === 'OCUPADA') {
        console.log('\n🎉 TESTE COMPLETO! Mesa atualizada corretamente.');
      } else {
        console.warn('\n⚠️ Mesa não foi atualizada para OCUPADA');
      }
    } else {
      console.error('\n❌ FALHA ao criar pedido!');
      console.error('   Erro:', orderResult.error);
      
      // Debug adicional
      if (orderResponse.status === 403) {
        console.error('\n🔍 PROBLEMA DE PERMISSÃO detectado!');
        console.error('   Verificando permissões do role:', userData.role);
      }
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }

  console.log('\n🧪 === FIM DO TESTE ===');
};

// Executar teste
testStaffOrderFlow();

