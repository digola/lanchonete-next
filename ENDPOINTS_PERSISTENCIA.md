# 🗄️ **Endpoints que Persistem Dados no Banco - Sistema de Lanchonete**

## 📋 **Resumo Geral**

Lista completa de todos os endpoints da API que **necessariamente persistem dados** no banco de dados, organizados por categoria e operação.

---

## 🛒 **PEDIDOS (Orders)**

### **POST /api/orders**
- **Operação**: Criar novo pedido
- **Persiste**: `Order` + `OrderItem[]`
- **Dados**: Pedido completo com itens, status, total, tipo de entrega, método de pagamento
- **Uso**: Finalização do carrinho pelo cliente

### **PUT /api/orders/[id]**
- **Operação**: Atualizar pedido existente
- **Persiste**: `Order` (status, total, observações)
- **Dados**: Mudanças de status, atualizações de informações
- **Uso**: Atualização de status por funcionários/admin

### **POST /api/orders/[id]/review**
- **Operação**: Criar avaliação do pedido
- **Persiste**: `OrderReview`
- **Dados**: Rating, comentário, associação com pedido
- **Uso**: Cliente avalia pedido entregue

---

## 🍔 **PRODUTOS (Products)**

### **POST /api/products**
- **Operação**: Criar novo produto
- **Persiste**: `Product`
- **Dados**: Nome, descrição, preço, categoria, disponibilidade
- **Uso**: Admin adiciona produtos ao cardápio

### **PUT /api/products/[id]**
- **Operação**: Atualizar produto existente
- **Persiste**: `Product` (todos os campos)
- **Dados**: Modificações de preço, descrição, disponibilidade
- **Uso**: Admin edita informações do produto

### **DELETE /api/products/[id]**
- **Operação**: Deletar produto
- **Persiste**: Exclusão do `Product`
- **Dados**: Remove produto do sistema
- **Uso**: Admin remove produtos descontinuados

### **POST /api/products/bulk**
- **Operação**: Operações em lote
- **Persiste**: Múltiplos `Product`
- **Dados**: Ativação/desativação, mudança de categoria, atualização de preços
- **Uso**: Admin gerencia múltiplos produtos

---

## 📂 **CATEGORIAS (Categories)**

### **POST /api/categories**
- **Operação**: Criar nova categoria
- **Persiste**: `Category`
- **Dados**: Nome, descrição, cor, status ativo
- **Uso**: Admin cria categorias de produtos

### **PUT /api/categories/[id]**
- **Operação**: Atualizar categoria existente
- **Persiste**: `Category` (todos os campos)
- **Dados**: Modificações de nome, descrição, cor
- **Uso**: Admin edita categorias

### **DELETE /api/categories/[id]**
- **Operação**: Deletar categoria
- **Persiste**: Exclusão do `Category`
- **Dados**: Remove categoria do sistema
- **Uso**: Admin remove categorias não utilizadas

---

## 👥 **USUÁRIOS (Users)**

### **POST /api/users**
- **Operação**: Criar novo usuário
- **Persiste**: `User`
- **Dados**: Nome, email, senha, role, status ativo
- **Uso**: Admin cria contas de funcionários

### **PUT /api/users/[id]**
- **Operação**: Atualizar usuário existente
- **Persiste**: `User` (todos os campos)
- **Dados**: Modificações de perfil, status ativo, role
- **Uso**: Admin gerencia usuários

### **DELETE /api/users/[id]**
- **Operação**: Deletar usuário
- **Persiste**: Exclusão do `User`
- **Dados**: Remove usuário do sistema
- **Uso**: Admin remove usuários inativos

---

## 🪑 **MESAS (Tables)**

### **POST /api/tables**
- **Operação**: Criar nova mesa
- **Persiste**: `Table`
- **Dados**: Número, capacidade, status, localização
- **Uso**: Admin configura mesas do estabelecimento

### **PUT /api/tables/[id]**
- **Operação**: Atualizar mesa existente
- **Persiste**: `Table` (status, capacidade, responsável)
- **Dados**: Mudanças de status, atribuição de responsável
- **Uso**: Funcionários gerenciam mesas

### **DELETE /api/tables/[id]**
- **Operação**: Deletar mesa
- **Persiste**: Exclusão do `Table`
- **Dados**: Remove mesa do sistema
- **Uso**: Admin remove mesas não utilizadas

---

## 🔐 **AUTENTICAÇÃO (Auth)**

### **POST /api/auth/register**
- **Operação**: Registrar novo usuário
- **Persiste**: `User`
- **Dados**: Criação de conta de cliente
- **Uso**: Clientes se cadastram no sistema

### **POST /api/auth/login**
- **Operação**: Login do usuário
- **Persiste**: `User` (último login, sessão)
- **Dados**: Atualização de dados de sessão
- **Uso**: Autenticação de usuários

### **POST /api/auth/logout**
- **Operação**: Logout do usuário
- **Persiste**: `User` (dados de sessão)
- **Dados**: Limpeza de tokens, sessão
- **Uso**: Encerramento de sessão

### **POST /api/auth/refresh**
- **Operação**: Renovar token
- **Persiste**: `User` (tokens)
- **Dados**: Atualização de tokens de acesso
- **Uso**: Renovação automática de sessão

---

## 📤 **UPLOAD DE ARQUIVOS**

### **POST /api/upload/image**
- **Operação**: Upload de imagem
- **Persiste**: Arquivo no sistema de arquivos
- **Dados**: Imagens de produtos, categorias, usuários
- **Uso**: Upload de imagens para produtos/categorias

### **POST /api/products/upload**
- **Operação**: Upload específico para produtos
- **Persiste**: Arquivo + referência no banco
- **Dados**: Imagens de produtos com metadados
- **Uso**: Upload otimizado para produtos

---

## 📊 **ESTATÍSTICAS E RELATÓRIOS**

### **Endpoints que NÃO persistem dados (apenas leitura):**
- `GET /api/orders` - Listar pedidos
- `GET /api/products` - Listar produtos
- `GET /api/categories` - Listar categorias
- `GET /api/users` - Listar usuários
- `GET /api/tables` - Listar mesas
- `GET /api/auth/me` - Dados do usuário logado

---

## 🎯 **Resumo por Tipo de Operação**

### **🔴 CRIAÇÃO (POST) - 8 endpoints**
1. `POST /api/orders` - Criar pedido
2. `POST /api/products` - Criar produto
3. `POST /api/categories` - Criar categoria
4. `POST /api/users` - Criar usuário
5. `POST /api/tables` - Criar mesa
6. `POST /api/auth/register` - Registrar usuário
7. `POST /api/orders/[id]/review` - Criar avaliação
8. `POST /api/products/bulk` - Operações em lote

### **🟡 ATUALIZAÇÃO (PUT) - 4 endpoints**
1. `PUT /api/orders/[id]` - Atualizar pedido
2. `PUT /api/products/[id]` - Atualizar produto
3. `PUT /api/categories/[id]` - Atualizar categoria
4. `PUT /api/users/[id]` - Atualizar usuário
5. `PUT /api/tables/[id]` - Atualizar mesa

### **🔴 EXCLUSÃO (DELETE) - 4 endpoints**
1. `DELETE /api/products/[id]` - Deletar produto
2. `DELETE /api/categories/[id]` - Deletar categoria
3. `DELETE /api/users/[id]` - Deletar usuário
4. `DELETE /api/tables/[id]` - Deletar mesa

### **🔵 AUTENTICAÇÃO - 4 endpoints**
1. `POST /api/auth/login` - Login
2. `POST /api/auth/logout` - Logout
3. `POST /api/auth/refresh` - Renovar token
4. `POST /api/auth/register` - Registrar

### **📤 UPLOAD - 2 endpoints**
1. `POST /api/upload/image` - Upload geral
2. `POST /api/products/upload` - Upload de produtos

---

## 🏆 **Total de Endpoints que Persistem Dados**

**✅ 18 endpoints** que necessariamente persistem dados no banco de dados

**📊 Distribuição:**
- **Criação**: 8 endpoints
- **Atualização**: 5 endpoints  
- **Exclusão**: 4 endpoints
- **Autenticação**: 4 endpoints
- **Upload**: 2 endpoints

**🎯 Todos esses endpoints são críticos para o funcionamento do sistema e devem ser testados e monitorados adequadamente.**
