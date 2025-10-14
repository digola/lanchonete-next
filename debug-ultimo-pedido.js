// Script para verificar o que aconteceu com o último pedido
// Execute no console do navegador (F12 → Console)

console.log('🔍 === VERIFICANDO ÚLTIMO PEDIDO ===\n');

// 1. Verificar dados do localStorage
console.log('1️⃣ Dados de Autenticação:');
const token = localStorage.getItem('auth-token');
const userStr = localStorage.getItem('auth-user');
const user = userStr ? JSON.parse(userStr) : null;

console.log('   Token:', token ? '✅ Presente' : '❌ Ausente');
console.log('   Usuário:', user?.name || 'N/A');
console.log('   Role:', user?.role || 'N/A');
console.log('   User ID:', user?.id || 'N/A');

// 2. Verificar carrinho
console.log('\n2️⃣ Estado do Carrinho:');
const cartStr = localStorage.getItem('cart-storage');
const cartData = cartStr ? JSON.parse(cartStr) : null;
console.log('   Itens no carrinho:', cartData?.state?.items?.length || 0);
if (cartData?.state?.items?.length > 0) {
  console.log('   Produtos:', cartData.state.items.map(i => ({
    produto: i.product?.name,
    quantidade: i.quantity,
    preço: i.price
  })));
}

// 3. Verificar URL atual
console.log('\n3️⃣ Informações da Página:');
console.log('   URL atual:', window.location.href);
const urlParams = new URLSearchParams(window.location.search);
const tableId = urlParams.get('tableId');
console.log('   TableId na URL:', tableId || 'N/A');

// 4. Testar buscar pedidos do usuário
console.log('\n4️⃣ Buscando pedidos do usuário...');
if (token && user?.id) {
  fetch(`/api/orders?userId=${user.id}&limit=5&includeItems=true`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(res => res.json())
  .then(data => {
    console.log('   Status:', data.success ? '✅ OK' : '❌ Erro');
    console.log('   Total de pedidos:', data.data?.length || 0);
    if (data.data && data.data.length > 0) {
      console.log('\n   Últimos pedidos:');
      data.data.forEach((order, idx) => {
        console.log(`   ${idx + 1}. ID: ${order.id.substring(0, 8)}...`);
        console.log(`      Status: ${order.status}`);
        console.log(`      Total: R$ ${order.total}`);
        console.log(`      Mesa: ${order.table?.number || 'N/A'}`);
        console.log(`      Criado: ${new Date(order.createdAt).toLocaleString()}`);
        console.log(`      Itens: ${order.items?.length || 0}`);
      });
    }
  })
  .catch(err => {
    console.error('   ❌ Erro ao buscar pedidos:', err);
  });
} else {
  console.log('   ⚠️ Não é possível buscar - token ou userId ausente');
}

console.log('\n🔍 === FIM DA VERIFICAÇÃO ===');
console.log('\n💡 Dica: Abra a aba "Network" (Rede) nas DevTools e tente fazer o pedido novamente.');
console.log('   Procure por uma requisição POST para /api/orders e veja a resposta.');

