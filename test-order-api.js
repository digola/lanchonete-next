// Script de teste para verificar se a API de pedidos está funcionando
const testOrderCreation = async () => {
  try {
    console.log('🧪 Testando criação de pedido...');
    
    // Dados de teste
    const orderData = {
      items: [
        {
          productId: 'test-product-id',
          quantity: 1,
          price: 10.50
        }
      ],
      deliveryType: 'RETIRADA',
      paymentMethod: 'DINHEIRO',
      notes: 'Teste de pedido',
      total: 10.50
    };

    console.log('📦 Dados do pedido:', orderData);

    // Fazer requisição para a API
    const response = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify(orderData)
    });

    console.log('📡 Status da resposta:', response.status);
    console.log('📡 Headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.text();
    console.log('📄 Resposta:', result);

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
};

// Executar teste se estiver no navegador
if (typeof window !== 'undefined') {
  testOrderCreation();
} else {
  console.log('Execute este script no console do navegador quando estiver na página do carrinho');
}
