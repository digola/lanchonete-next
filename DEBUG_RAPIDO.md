# ⚡ Debug Rápido - Pedido Não Salvou

## 🎯 Execute AGORA no Console do Navegador

### 1. Abra o Console (F12)

### 2. Cole este código:

```javascript
// ===== SCRIPT DE DEBUG RÁPIDO =====
console.clear();
console.log('%c🔍 VERIFICANDO PROBLEMA DO PEDIDO', 'font-size: 16px; font-weight: bold; color: blue;');

// Verificar autenticação
const token = localStorage.getItem('auth-token');
const userStr = localStorage.getItem('auth-user');
const user = userStr ? JSON.parse(userStr) : null;

console.log('\n📋 Dados de Login:');
console.log('   Token:', token ? '✅' : '❌ FALTA TOKEN');
console.log('   Usuário:', user?.name || '❌ FALTA USUÁRIO');
console.log('   Role:', user?.role || '❌');

if (!token) {
  console.error('❌ PROBLEMA: Você não está autenticado. Faça login novamente!');
}

// Verificar carrinho
const cartStr = localStorage.getItem('cart-storage');
const cart = cartStr ? JSON.parse(cartStr) : null;
const items = cart?.state?.items || [];

console.log('\n🛒 Carrinho:');
console.log('   Itens:', items.length);
if (items.length === 0) {
  console.error('❌ PROBLEMA: Carrinho está vazio!');
} else {
  items.forEach((item, i) => {
    console.log(`   ${i+1}. ${item.product?.name} - Qtd: ${item.quantity}`);
  });
}

// Verificar tableId (se staff)
const isStaff = user?.role === 'STAFF' || user?.role === 'ADMIN';
const urlParams = new URLSearchParams(window.location.search);
const tableId = urlParams.get('tableId');

if (isStaff) {
  console.log('\n🪑 Mesa (você é STAFF):');
  console.log('   TableId na URL:', tableId || '❌ FALTA TABLEID');
  if (!tableId) {
    console.error('❌ PROBLEMA: Staff precisa selecionar uma mesa primeiro!');
  }
}

// Tentar criar pedido de teste
console.log('\n🧪 Testando criação de pedido...');

if (!token) {
  console.error('❌ Cancelado: precisa fazer login primeiro');
} else if (items.length === 0) {
  console.error('❌ Cancelado: carrinho está vazio');
} else {
  const orderData = {
    items: items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price
    })),
    ...(isStaff && tableId ? { tableId } : {
      deliveryType: 'RETIRADA',
    }),
    paymentMethod: 'DINHEIRO',
    total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  };

  console.log('📤 Enviando pedido:', orderData);

  fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
  })
  .then(async response => {
    const result = await response.json();
    
    console.log('\n📥 Resposta da API:');
    console.log('   Status:', response.status);
    console.log('   Sucesso:', result.success ? '✅' : '❌');
    
    if (response.ok) {
      console.log('%c✅ PEDIDO CRIADO COM SUCESSO!', 'font-size: 14px; font-weight: bold; color: green;');
      console.log('   ID do Pedido:', result.data?.id);
      console.log('   Total:', 'R$', result.data?.total);
      console.log('\n🎉 O problema NÃO é falta de permissão!');
      console.log('   Verifique se o pedido apareceu no banco de dados.');
    } else {
      console.error('%c❌ ERRO AO CRIAR PEDIDO', 'font-size: 14px; font-weight: bold; color: red;');
      console.error('   Status:', response.status);
      console.error('   Mensagem:', result.error);
      
      if (response.status === 403) {
        console.error('\n🚨 PROBLEMA DE PERMISSÃO!');
        console.error('   Solução: Faça LOGOUT e LOGIN novamente');
      } else if (response.status === 400) {
        console.error('\n🚨 DADOS INVÁLIDOS!');
        console.error('   Verifique os dados acima');
      } else if (response.status === 401) {
        console.error('\n🚨 NÃO AUTENTICADO!');
        console.error('   Solução: Faça LOGIN novamente');
      }
    }
  })
  .catch(err => {
    console.error('❌ Erro na requisição:', err);
  });
}

console.log('\n' + '='.repeat(50));
```

### 3. Anote o que apareceu

Me diga qual foi o resultado! Especialmente:
- ✅ ou ❌ em cada verificação
- Status da resposta da API
- Mensagem de erro (se houver)

---

## 📝 Respostas Possíveis

### Se aparecer "✅ PEDIDO CRIADO COM SUCESSO"
→ O problema NÃO é no código
→ Verifique o banco com: `npx prisma studio`

### Se aparecer "❌ PROBLEMA: Você não está autenticado"
→ Faça login novamente

### Se aparecer "❌ PROBLEMA: Carrinho está vazio"
→ Adicione produtos antes de testar

### Se aparecer "❌ PROBLEMA DE PERMISSÃO"
→ Faça LOGOUT e LOGIN novamente
→ A correção só vale para novas sessões

### Se aparecer "❌ DADOS INVÁLIDOS"
→ Me envie o log completo

---

## 🔥 MAIS IMPORTANTE

**Se você acabou de corrigir o código:**
1. Faça **LOGOUT** 
2. Faça **LOGIN** novamente
3. Tente criar o pedido

A correção de permissões só funciona em **novas sessões**!

---

## ❓ Me envie:
1. O resultado do script acima
2. Você fez logout/login depois da correção?
3. Você é STAFF ou CLIENTE?

