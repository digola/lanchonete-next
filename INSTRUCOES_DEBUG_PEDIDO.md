# 🔍 Debug - Pedido Não Salvou no Banco

## 🚨 Problema
O pedido foi enviado mas não apareceu no banco de dados.

## 📋 Checklist de Verificação

### PASSO 1: Verificar Console do Navegador

1. **Abra o Console** (F12 → Console)
2. **Cole e execute** o conteúdo de `debug-ultimo-pedido.js`
3. **Anote os erros** que aparecerem

**O que procurar:**
- ❌ Erros em vermelho
- ⚠️ Avisos em amarelo
- Token presente?
- Pedidos anteriores existem?

---

### PASSO 2: Verificar Network (Rede)

1. **Abra DevTools** (F12)
2. **Vá para a aba "Network" (Rede)**
3. **Limpe o log** (ícone 🚫)
4. **Tente fazer o pedido novamente**
5. **Procure pela requisição:** `POST /api/orders`

**Clique na requisição e verifique:**

#### Request (Requisição):
```json
{
  "items": [...],
  "tableId": "xxx",  // ← deve estar presente se for STAFF
  "paymentMethod": "DINHEIRO",
  "total": 99.99
}
```

#### Response (Resposta):
- **Status 200** ✅ = Sucesso
- **Status 400** ⚠️ = Dados inválidos
- **Status 401** 🔒 = Não autenticado
- **Status 403** 🚫 = Sem permissão
- **Status 500** ❌ = Erro do servidor

---

### PASSO 3: Verificar Logs do Servidor

No terminal onde o Next está rodando, procure por:

```bash
# Logs de sucesso:
🔍 Atualizando mesa ID: xxx
✅ Pedido criado com sucesso na transação: xxx
🎉 Transação concluída com sucesso!

# Logs de erro:
❌ Erro ao criar pedido: ...
❌ Token inválido
❌ Sem permissão para criar pedidos
```

---

### PASSO 4: Verificar Banco de Dados

**Opção A - Via Prisma Studio:**
```bash
npx prisma studio
```
1. Abra `http://localhost:5555`
2. Clique em `Order`
3. Verifique se há pedidos recentes

**Opção B - Via SQL direto:**
```bash
# Se SQLite
sqlite3 prisma/dev.db
SELECT * FROM Order ORDER BY createdAt DESC LIMIT 5;
.quit
```

---

## 🔧 Problemas Comuns e Soluções

### 1. Erro 403 - "Permissão insuficiente"

**Causa:** Permissões faltando
**Solução:** Já corrigido no `authStore.ts`, mas precisa recarregar a página

```bash
# Faça logout e login novamente
```

### 2. Erro 400 - "Itens do pedido são obrigatórios"

**Causa:** Carrinho vazio ou dados mal formatados
**Solução:** 
- Verifique se tem produtos no carrinho
- Execute `debug-ultimo-pedido.js` para ver os itens

### 3. Erro 400 - "Mesa não encontrada"

**Causa:** TableId inválido
**Solução:**
- Verifique se a URL tem `?tableId=xxx`
- Confirme que a mesa existe no banco

### 4. Status 200 mas pedido não aparece

**Causa:** Possível erro silencioso na transação do Prisma
**Solução:**
1. Verifique logs do servidor
2. Confirme que não há erro de validação
3. Teste com Prisma Studio se o banco está respondendo

### 5. Request nem aparece no Network

**Causa:** JavaScript com erro antes de fazer a requisição
**Solução:**
- Veja erros no Console
- Verifique se o botão está disparando o evento

---

## 🧪 Teste Rápido

Execute este comando no Console para testar criação direta:

```javascript
// Copie e cole no console do navegador
const token = localStorage.getItem('auth-token');

// Pegue um produto qualquer
fetch('/api/products?limit=1&isAvailable=true')
  .then(r => r.json())
  .then(async productsData => {
    const product = productsData.data[0];
    
    // Tente criar pedido
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        items: [{
          productId: product.id,
          quantity: 1,
          price: product.price
        }],
        deliveryType: 'RETIRADA',
        paymentMethod: 'DINHEIRO',
        total: product.price
      })
    });
    
    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Resultado:', result);
    
    if (response.ok) {
      console.log('✅ SUCESSO! Pedido ID:', result.data.id);
    } else {
      console.error('❌ ERRO:', result.error);
    }
  });
```

---

## 📊 Checklist Final

Após executar os passos acima, responda:

- [ ] Console mostra algum erro?
- [ ] Network mostra a requisição POST /api/orders?
- [ ] Qual foi o status da resposta? (200, 400, 403, 500?)
- [ ] O que diz o corpo da resposta?
- [ ] Há logs de erro no terminal do servidor?
- [ ] O banco tem pedidos antigos ou está vazio?
- [ ] Você fez logout/login depois da correção?

---

## 💬 Próximo Passo

**Me envie:**
1. Screenshot do erro no Console (se houver)
2. Status da requisição no Network
3. Mensagem de erro da resposta
4. Logs do terminal do servidor

Com essas informações, consigo identificar exatamente o problema!

