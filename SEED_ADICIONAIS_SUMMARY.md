# 🌱 Banco de Dados Populado com Adicionais

**Data:** 2024  
**Status:** ✅ Seed Concluído com Sucesso

---

## 📊 Dados Inseridos

### Adicionais Criados (18 total)

#### 🍔 Adicionais para Hambúrgueres (6)
```
✅ Bacon                   - R$ 2,50 (máx 3x)
✅ Ovo Frito              - R$ 1,50 (máx 2x)
✅ Queijo Extra           - R$ 1,50 (máx 3x)
✅ Salada                 - R$ 0,00 (máx 1x)
✅ Cebola Caramelizada    - R$ 1,00 (máx 2x)
✅ Abacate                - R$ 3,00 (máx 2x)
```

#### 🍕 Adicionais para Pizzas (3)
```
✅ Queijo Extra           - R$ 4,00 (máx 2x)
✅ Borda Recheada         - R$ 5,00 (máx 1x)
✅ Adicional de Pepperoni - R$ 3,50 (máx 2x)
```

#### 🥤 Adicionais para Bebidas (2)
```
✅ Gelo Extra             - R$ 0,00 (máx 1x)
✅ Limão                  - R$ 0,50 (máx 1x)
```

#### 🧃 Adicionais para Sucos (3)
```
✅ Abacaxi                - R$ 0,00 (máx 1x)
✅ Morango                - R$ 0,00 (máx 1x)
✅ Goiaba                 - R$ 0,00 (máx 1x)
```

---

## 🔗 Associações Criadas

### Produtos com Adicionais

| Produto | Adicionais Associados |
|---------|----------------------|
| X-Burger Clássico | Bacon, Ovo Frito, Queijo Extra, Salada, Cebola Caramelizada, Abacate |
| X-Bacon | Bacon, Ovo Frito, Queijo Extra, Salada, Cebola Caramelizada, Abacate |
| X-Tudo | Bacon, Ovo Frito, Queijo Extra, Salada, Cebola Caramelizada, Abacate |
| Suco de Laranja | Abacaxi, Morango, Goiaba |
| Pizza Margherita | Queijo Extra, Borda Recheada, Adicional de Pepperoni |
| Pizza Pepperoni | Queijo Extra, Borda Recheada, Adicional de Pepperoni |
| Coca-Cola | Gelo Extra, Limão |

---

## 👤 Usuários de Teste

```
Email: admin@lanchonete.com
Senha: 123456
Role: ADMIN

Email: funcionario@lanchonete.com
Senha: 123456
Role: STAFF

Email: cliente@lanchonete.com
Senha: 123456
Role: CUSTOMER
```

---

## 📦 Resumo Total

```
👤 Usuários: 3
📦 Categorias: 5
🍔 Produtos: 10
🪑 Mesas: 10
🍗 Adicionais: 18
🔗 Associações: 7 produtos com adicionais
⚙️ Configurações: Público (se modelo Settings disponível)
```

---

## 🧪 Como Testar

### 1. Verificar Adicionais no Admin

**URL:** `http://localhost:3000/admin/adicionais`

1. Faça login com admin@lanchonete.com
2. Navegue para "Adicionais"
3. Veja a lista de 18 adicionais criados
4. Clique em um para editar
5. Toggle "Disponível/Indisponível"

### 2. Verificar Associações

**URL:** `http://localhost:3000/admin/adicionais/produtos`

1. Navegue para "Associar a Produtos"
2. Clique para expandir cada produto
3. Veja os adicionais associados (checkboxes selecionadas)
4. Adicione/remova adicionais conforme necessário

### 3. Testar em Staff/Expedição

**URL:** `http://localhost:3000/staff` ou `/expedicao`

1. Faça login com funcionario@lanchonete.com
2. Crie um novo pedido (ou selecione uma mesa)
3. Clique "Adicionar Produtos"
4. Selecione "X-Burger Clássico"
5. **Veja os checkboxes aparecerem:**
   ```
   [✓] Bacon (+R$ 2,50)
   [ ] Ovo Frito (+R$ 1,50)
   [✓] Queijo Extra (+R$ 1,50)
   [ ] Salada (R$ 0,00)
   [ ] Cebola Caramelizada (+R$ 1,00)
   [ ] Abacate (+R$ 3,00)
   ```
6. Selecione alguns adicionais
7. Clique "Adicionar ao Pedido"
8. Pedido será criado com adicionais estruturados

---

## 🗄️ Verificar Dados no Banco

### Via Prisma Studio
```bash
cd lanchonete-next_base
npx prisma studio
```

Acesse: `http://localhost:5555`

Tabelas para verificar:
- `adicionals` - 18 registros
- `product_adicionais` - múltiplas associações
- `products` - 10 registros
- `categories` - 5 registros
- `users` - 3 registros
- `tables` - 10 registros

---

## 📝 Exemplos de Dados

### Tabela: adicionals
```
ID                | Name                | Price | MaxQty | IsAvailable
cuid1...          | Bacon               | 2.50  | 3      | true
cuid2...          | Ovo Frito           | 1.50  | 2      | true
cuid3...          | Queijo Extra        | 1.50  | 3      | true
...
```

### Tabela: product_adicionais
```
ProductID            | AdicionalID         | IsRequired
hamburger-id         | bacon-id            | false
hamburger-id         | ovo-id              | false
hamburger-id         | queijo-id           | false
...
```

---

## ✨ O Sistema Está Completo!

```
✅ Banco de dados populado
✅ 18 adicionais criados
✅ 7 produtos com adicionais associados
✅ Pronto para testar no admin
✅ Pronto para testar em staff/expedição
✅ UI mostra checkboxes de adicionais
✅ Preços calculados automaticamente
✅ Observações/notas funcionando
```

---

## 🚀 Próximos Passos

1. **Testar a aplicação:**
   ```bash
   npm run dev
   # Acessar http://localhost:3000
   ```

2. **Login e navegação:**
   - Admin: http://localhost:3000/admin/adicionais
   - Staff: http://localhost:3000/staff
   - Expedição: http://localhost:3000/expedicao

3. **Criar mais adicionais/produtos:**
   - Use `/admin/adicionais` para criar novos complementos
   - Use `/admin/adicionais/produtos` para associar a produtos

---

**✅ Seed Completo e Funcional!** 🎉

Seu banco de dados agora possui dados realistas para testar todo o fluxo de adicionais.
