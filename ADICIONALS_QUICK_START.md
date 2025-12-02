# Quick Start Guide - Sistema de Adicionais

## 1️⃣ Para Gerentes/Admins - Criar Adicionais

### Via API (curl)
```bash
# Criar um novo adicional
curl -X POST http://localhost:3000/api/adicionais \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bacon Crocante",
    "description": "Bacon premium crocante",
    "price": 2.50,
    "maxQuantity": 3
  }'

# Resposta
{
  "success": true,
  "data": {
    "id": "cuid123...",
    "name": "Bacon Crocante",
    "price": 2.50,
    "isAvailable": true
  }
}
```

### Via JavaScript
```javascript
// Criar adicional
async function createAdicional(name, price, maxQuantity) {
  const response = await fetch('/api/adicionais', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      price,
      maxQuantity,
      description: `${name} personalizado`
    })
  });
  return response.json();
}

// Exemplo
createAdicional('Bacon', 2.50, 3);
```

---

## 2️⃣ Associar Adicionais a Produtos

### Via API
```bash
# Associar "Bacon" ao "Hamburguer"
curl -X POST http://localhost:3000/api/products/hamburger-id/adicionais \
  -H "Content-Type: application/json" \
  -d '{
    "adicionalId": "bacon-id",
    "isRequired": false
  }'
```

### Via JavaScript
```javascript
async function linkAdicionalToProduct(productId, adicionalId, isRequired = false) {
  const response = await fetch(`/api/products/${productId}/adicionais`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adicionalId, isRequired })
  });
  return response.json();
}

// Exemplo: Associar múltiplos adicionais a um Hamburguer
async function setupHamburger(hamburger_id) {
  const adicionais = ['bacon_id', 'salada_id', 'queijo_id'];
  
  for (const adicional_id of adicionais) {
    await linkAdicionalToProduct(hamburger_id, adicional_id, false);
  }
}
```

---

## 3️⃣ Para Staff - Adicionar Produtos com Adicionais

### Interface Visual (Staff/Expedição)

1. **Abrir Modal "Adicionar Produtos"**
   - Botão: `+` ao lado do pedido

2. **Selecionar Produto**
   - Clique em "Adicionar" no Hamburguer
   - Adicionais aparecem automaticamente

3. **Selecionar Adicionais**
   ```
   ✅ Bacon (+R$ 2,50)
   ☐ Salada
   ✅ Queijo Extra (+R$ 1,50)
   ```

4. **Adicionar Observações**
   - Campo: "Observações (ex.: sem cebola, extra picante)"

5. **Ajustar Quantidade**
   - Botões: `-` e `+`

6. **Confirmar**
   - Clique em "Adicionar ao Pedido"

---

## 4️⃣ Dados Estrutura - Ordem com Adicionais

```javascript
// Como a ordem é enviada para o backend
{
  "items": [
    {
      "productId": "hamburger-id",
      "quantity": 2,
      "adicionaisIds": ["bacon-id", "queijo-id"],
      "notes": "Sem cebola"
    }
  ]
}

// Como é armazenado na resposta
{
  "id": "order-id",
  "items": [
    {
      "id": "order-item-id",
      "productId": "hamburger-id",
      "quantity": 2,
      "price": 18.50,
      "notes": "Sem cebola",
      "customizations": "{\"adicionaisIds\":[\"bacon-id\",\"queijo-id\"]}"
    }
  ]
}
```

---

## 5️⃣ Exemplos de Uso Real

### Setup Inicial - Criar Menu de Hamburgeria

```javascript
// 1. Criar Hamburguer Base
const burger = { name: "Hamburguer Clássico", price: 18.50 };

// 2. Criar Adicionais
const adicionais = [
  { name: "Bacon", price: 2.50 },
  { name: "Salada", price: 0 },
  { name: "Queijo Extra", price: 1.50 },
  { name: "Ovos", price: 1.50 },
  { name: "Abacate", price: 3.00 }
];

// 3. Associar tudo
// (Use os IDs retornados do banco)
```

### Setup Sucos com Sabores

```javascript
// Criar Suco Base
const juice = { name: "Suco Natural", price: 8.50 };

// Criar Sabores (como adicionais)
const flavors = [
  { name: "Abacaxi", price: 0 },
  { name: "Morango", price: 0 },
  { name: "Goiaba", price: 0 },
  { name: "Mix Frutas", price: 0.50 }
];

// Todos compartilham o mesmo preço base = 8.50
```

---

## 6️⃣ API Reference Completa

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/adicionais` | Listar todos |
| GET | `/api/adicionais?isAvailable=true` | Listar disponíveis |
| POST | `/api/adicionais` | Criar novo |
| PUT | `/api/adicionais` | Atualizar |
| DELETE | `/api/adicionais?id={id}` | Deletar |
| GET | `/api/products/{id}/adicionais` | Listar adicionais do produto |
| POST | `/api/products/{id}/adicionais` | Associar adicional |
| DELETE | `/api/products/{id}/adicionais?adicionalId={id}` | Remover associação |

---

## 7️⃣ Troubleshooting

### Problema: Adicionais não aparecem no modal
**Solução:**
1. Verificar se produto tem adicionais associados
   ```bash
   curl http://localhost:3000/api/products/PRODUCT_ID/adicionais
   ```
2. Verificar console do navegador (F12) para erros de fetch
3. Verificar se adicionais estão com `isAvailable: true`

### Problema: Erro 409 ao associar adicional
**Solução:**
- Este adicional já está associado ao produto
- Delete a associação anterior e tente novamente

### Problema: Preços de adicionais não aparecem
**Solução:**
- Verificar se o campo `price` foi preenchido ao criar adicional
- Pode ser 0 (gratuito)

---

## 8️⃣ Validações e Limites

- ✅ Máximo 1 adicional por seleção (padrão)
- ✅ Preço adicional automaticamente somado
- ✅ Campo de observações para pedidos especiais
- ✅ Sem limite de adicionais por produto (no BD)
- ✅ Sem limite de produtos com adicionais na mesma ordem

---

## 9️⃣ Exemplos Real-World

### Hamburgeria
```
Hamburguer Clássico (R$ 18,50)
├─ Bacon (R$ 2,50) ✅
├─ Salada (R$ 0,00)
├─ Queijo Extra (R$ 1,50) ✅
└─ Ovos (R$ 1,50)
Total: R$ 23,50

Observações: "Bem cozido, pão torrado"
```

### Pizzaria
```
Pizza Margherita (R$ 35,00)
├─ Queijo Extra (R$ 3,00) ✅
├─ Borda Recheada (R$ 5,00) ✅
├─ Sem Cebola (R$ 0,00) ✅
└─ Bebida (R$ 0,00)
Total: R$ 43,00
```

### Açaí
```
Açaí 500ml (R$ 15,00)
├─ Banana (R$ 0,00) ✅
├─ Morango (R$ 0,00)
├─ Granola Extra (R$ 2,00) ✅
└─ Mel (R$ 0,00) ✅
Total: R$ 17,00
```

---

## 🔟 Performance

- ⚡ Adicionais buscados apenas quando necessário (lazy load)
- ⚡ Cache de 5 minutos em settings públicas
- ⚡ Queries paralelizadas com `Promise.all()`
- ⚡ Sem impacto em performance de carregamento do modal

---

**Dúvidas?** Consulte `ADICIONALS_IMPLEMENTATION.md` para documentação técnica completa.
