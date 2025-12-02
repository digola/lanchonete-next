# Admin CRUD - Adicionais

## 📍 Localização das Páginas

### 1. Gerenciar Adicionais
**URL:** `http://localhost:3000/admin/adicionais`

**Funcionalidades:**
- ✅ Listar todos os adicionais
- ✅ Buscar/filtrar por nome ou descrição
- ✅ Criar novo adicional (nome, descrição, preço, qtd máxima)
- ✅ Editar adicional
- ✅ Deletar adicional
- ✅ Ativar/Desativar disponibilidade (botão toggle)
- ✅ Estatísticas: Total, Disponíveis, Indisponíveis, Valor Total

**Features:**
- Interface responsiva com tabela
- Cards de estatísticas
- Modal de criação/edição
- Confirmação de exclusão
- Busca em tempo real
- Botão de refresh

---

### 2. Associar Adicionais a Produtos
**URL:** `http://localhost:3000/admin/adicionais/produtos`

**Funcionalidades:**
- ✅ Listar todos os produtos
- ✅ Expandir/colapsar detalhes do produto
- ✅ Ver adicionais já associados
- ✅ Adicionar novo adicional ao produto
- ✅ Remover adicional do produto
- ✅ Filtrar produtos por nome
- ✅ Estatísticas: Total de produtos, Com adicionais, Adicionais disponíveis

**Features:**
- Accordion layout para cada produto
- Modal para seleção de adicional
- Listagem dos adicionais associados
- Botão toggle para expandir/colapsar
- Filtro de adicionais já associados

---

## 🎨 Design

### Layout Principal
```
┌─────────────────────────────────┐
│ Header + Tabs (Adicionais | Produtos)
├─────────────────────────────────┤
│                                 │
│  Search/Filter                  │
├─────────────────────────────────┤
│  Stats Cards (4 colunas)        │
├─────────────────────────────────┤
│                                 │
│  Tabela/Lista de Produtos       │
│                                 │
└─────────────────────────────────┘
```

### Cores & Estilos
- 🟦 Azul (Ações: editar, criar)
- 🟩 Verde (Disponível, positivo)
- 🟥 Vermelho (Deletar, indisponível)
- 🟪 Roxo (Valores totais)

---

## 🔄 Fluxo de Uso

### Cenário 1: Criar Novo Adicional
```
1. Ir para /admin/adicionais
2. Clicar em "+ Novo Adicional"
3. Preencher:
   - Nome: "Bacon" *
   - Descrição: "Bacon crocante premium"
   - Preço: 2.50
   - Qtd Máx: 3
4. Clicar "Criar Adicional"
5. Adicional aparece na tabela
```

### Cenário 2: Associar Adicional a Produto
```
1. Ir para /admin/adicionais/produtos
2. Encontrar produto (ex: "Hamburguer")
3. Clicar para expandir
4. Clicar em "+ Adicionar Complemento"
5. Modal aparece com adicionais disponíveis
6. Selecionar (ex: "Bacon")
7. Clicar "Associar"
8. Bacon aparece na lista de adicionais do Hamburguer
```

### Cenário 3: Editar Adicional
```
1. Na tabela de adicionais, clicar botão ✏️ (Edit)
2. Modal abre com dados do adicional
3. Modificar campos
4. Clicar "Salvar Alterações"
5. Tabela atualiza
```

### Cenário 4: Deletar Adicional
```
1. Na tabela, clicar botão 🗑️ (Delete)
2. Modal de confirmação aparece
3. Clicar "Deletar"
4. Adicional é removido da tabela
5. Se estava associado a produtos, a associação é removida
```

---

## 📊 Dados Exibidos

### Tabela de Adicionais
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| Nome | String | Nome do adicional |
| Descrição | String | Descrição (ou "-") |
| Preço | Currency | Valor do adicional |
| Qtd Máx | Number | Quantidade máxima permitida |
| Status | Badge | Disponível/Indisponível (clicável) |
| Ações | Buttons | Edit, Delete |

### Stats Cards
| Card | Cálculo |
|------|---------|
| Total | COUNT(*) |
| Disponíveis | COUNT(isAvailable=true) |
| Indisponíveis | COUNT(isAvailable=false) |
| Valor Total | SUM(price) |

---

## 🛠️ API Endpoints Utilizados

### Adicionais
```
GET    /api/adicionais                    - Listar todos
POST   /api/adicionais                    - Criar novo
PUT    /api/adicionais                    - Atualizar
DELETE /api/adicionais?id={id}            - Deletar
```

### Produtos
```
GET    /api/products?limit=100            - Listar produtos
GET    /api/products/{id}/adicionais      - Adicionais do produto
POST   /api/products/{id}/adicionais      - Associar adicional
DELETE /api/products/{id}/adicionais?adicionalId={id} - Remover associação
```

---

## ✨ Recursos Especiais

### Toggle de Disponibilidade
- Clique direto no badge (Disponível/Indisponível)
- Alterna `isAvailable` sem abrir modal
- Atualiza cor imediatamente

### Accordion de Produtos
- Clique no header do produto para expandir/colapsar
- Mostra adicionais associados
- Botão para adicionar novo complemento
- Botão lixeira para remover complemento

### Busca em Tempo Real
- Filtra enquanto digita
- Funciona em nome e descrição
- Performance otimizada

### Validações
- ✅ Nome obrigatório
- ✅ Preço mínimo 0
- ✅ Quantidade máxima mínimo 1
- ✅ Evita duplicatas (ProductAdicional unique constraint)

---

## 🎯 Próximas Melhorias (Opcionais)

1. **Bulk Actions**
   - [ ] Selecionar múltiplos adicionais
   - [ ] Ativar/desativar em massa
   - [ ] Deletar múltiplos

2. **Import/Export**
   - [ ] Importar adicionais via CSV
   - [ ] Exportar lista de adicionais
   - [ ] Exportar associações

3. **Categorização**
   - [ ] Adicionar campo `category` em Adicional
   - [ ] Filtrar por categoria
   - [ ] Agrupar na listagem

4. **Pricing Avançado**
   - [ ] Preço por faixa de quantidade
   - [ ] Descontos em massa
   - [ ] Preços por cliente

---

## 📱 Responsividade

- ✅ Desktop: Tabela completa com 6 colunas
- ✅ Tablet: Tabela com scroll horizontal se necessário
- ✅ Mobile: Cards empilhados (na próxima fase)

---

## 🔐 Segurança

- ✅ Autenticação obrigatória (role ADMIN)
- ✅ Validação de input no frontend e backend
- ✅ CSRF protection (headers automáticos)
- ✅ Sem SQL injection (Prisma ORM)
- ✅ Confirmação antes de deletar

---

## 📞 Troubleshooting

### Problema: Adicional não aparece após criar
**Solução:**
1. Verifique console (F12) para erros
2. Clique no botão 🔄 Refresh
3. Verifique se o adicional foi criado em `/api/adicionais`

### Problema: Não consegue associar adicional
**Solução:**
1. Verifique se o adicional existe
2. Verifique se já não está associado (erro 409)
3. Clique em "Adicionar Complemento" novamente

### Problema: Deletar falha
**Solução:**
1. Se está associado a produtos, remova as associações primeiro
2. Recarregue a página
3. Tente novamente

---

**✅ Sistema de Admin CRUD para Adicionais - Completo e Funcional!**
