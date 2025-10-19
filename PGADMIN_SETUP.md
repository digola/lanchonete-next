# 🐘 pgAdmin - Interface Web para PostgreSQL

Este documento explica como usar o pgAdmin para administrar o banco de dados PostgreSQL do sistema Lanchonete.

## 📋 **Pré-requisitos**

- Docker e Docker Compose instalados
- Sistema Lanchonete configurado com PostgreSQL

## 🚀 **Iniciando o pgAdmin**

### 1. **Iniciar os Serviços**
```bash
# Iniciar todos os serviços (PostgreSQL + pgAdmin + App)
docker-compose up -d

# Ou apenas PostgreSQL + pgAdmin
docker-compose up -d db pgadmin
```

### 2. **Acessar o pgAdmin**
- **URL**: http://localhost:8080
- **Email**: admin@lanchonete.com
- **Senha**: admin123

## 🔧 **Configuração Inicial**

### **Adicionar Servidor PostgreSQL**

1. **Clique em "Add New Server"**
2. **Aba "General":**
   - **Name**: `Lanchonete DB`

3. **Aba "Connection":**
   - **Host name/address**: `db`
   - **Port**: `5432`
   - **Maintenance database**: `lanchonete_db`
   - **Username**: `app_user`
   - **Password**: `app_password`
   - **Save password**: ✅ Marcar

4. **Clique em "Save"**

## 📊 **Funcionalidades Disponíveis**

### **1. Visualizar Dados**
- Navegar pelas tabelas: `User`, `Category`, `Product`, `Order`, `OrderItem`, `Table`
- Visualizar dados em tempo real
- Executar consultas SQL personalizadas

### **2. Administração**
- Criar/editar/excluir registros
- Gerenciar índices e constraints
- Monitorar performance
- Fazer backup/restore

### **3. Consultas Úteis**

```sql
-- Ver todos os usuários
SELECT * FROM "User";

-- Ver produtos por categoria
SELECT p.name, c.name as category 
FROM "Product" p 
JOIN "Category" c ON p."categoryId" = c.id;

-- Ver pedidos com itens
SELECT o.id, o.status, oi.quantity, p.name 
FROM "Order" o 
JOIN "OrderItem" oi ON o.id = oi."orderId"
JOIN "Product" p ON oi."productId" = p.id;

-- Ver estatísticas de vendas
SELECT 
  DATE(o."createdAt") as date,
  COUNT(*) as total_orders,
  SUM(o.total) as total_revenue
FROM "Order" o 
WHERE o.status = 'COMPLETED'
GROUP BY DATE(o."createdAt")
ORDER BY date DESC;
```

## 🐳 **Comandos Docker Úteis**

```bash
# Ver logs do pgAdmin
docker logs lanchonete-pgadmin

# Reiniciar apenas o pgAdmin
docker-compose restart pgadmin

# Parar todos os serviços
docker-compose down

# Parar e remover volumes (CUIDADO: apaga dados)
docker-compose down -v
```

## 🔒 **Segurança**

### **Produção**
⚠️ **IMPORTANTE**: As credenciais padrão são apenas para desenvolvimento local.

Para produção, altere:
```yaml
environment:
  PGADMIN_DEFAULT_EMAIL: seu-email@empresa.com
  PGADMIN_DEFAULT_PASSWORD: senha-forte-aqui
```

### **Acesso Restrito**
```yaml
# Remover porta pública em produção
# ports:
#   - "8080:80"

# Usar apenas rede interna
networks:
  - internal
```

## 🛠️ **Troubleshooting**

### **Problema: Não consegue conectar ao servidor**
```bash
# Verificar se o PostgreSQL está rodando
docker ps | grep postgres

# Verificar logs do PostgreSQL
docker logs lanchonete-db
```

### **Problema: pgAdmin não carrega**
```bash
# Verificar logs do pgAdmin
docker logs lanchonete-pgadmin

# Reiniciar o serviço
docker-compose restart pgadmin
```

### **Problema: Erro de permissão**
```bash
# Limpar volumes e reiniciar
docker-compose down -v
docker-compose up -d
```

## 📱 **Alternativas Leves**

### **Adminer (mais leve)**
Se preferir uma alternativa mais leve ao pgAdmin:

```yaml
# Substituir pgAdmin por Adminer no docker-compose.yml
adminer:
  image: adminer:latest
  container_name: lanchonete-adminer
  ports:
    - "8080:8080"
  depends_on:
    - db
  restart: unless-stopped
```

**Acesso**: http://localhost:8080
- **Sistema**: PostgreSQL
- **Servidor**: db
- **Usuário**: app_user
- **Senha**: app_password
- **Base de dados**: lanchonete_db

## 🔗 **Links Úteis**

- [Documentação pgAdmin](https://www.pgadmin.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose Reference](https://docs.docker.com/compose/)

---

**Sistema Lanchonete** - Interface de Administração PostgreSQL