# 🚀 Configuração do Supabase

Este guia te ajudará a configurar o Supabase como banco de dados para resolver os erros HTTP 500.

## 📋 Pré-requisitos

1. Conta no [Supabase](https://supabase.com)
2. Projeto criado no Supabase

## 🔧 Passo a Passo

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Escolha:
   - **Name**: `lanchonete-sistema`
   - **Database Password**: Crie uma senha forte
   - **Region**: `South America (São Paulo)` (mais próximo do Brasil)
5. Clique em "Create new project"

### 2. Obter Credenciais de Conexão

Após criar o projeto:

1. Vá para **Settings** → **Database**
2. Na seção **Connection Info**, você encontrará:
   - **Host**: `db.xxx.supabase.co`
   - **Database name**: `postgres`
   - **Port**: `5432`
   - **User**: `postgres`
   - **Password**: A senha que você definiu

3. Na seção **Connection string**, copie:
   - **URI**: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`

### 3. Configurar Variáveis de Ambiente

Crie ou edite o arquivo `.env.local`:

```env
# Supabase Database
DATABASE_URL="postgresql://postgres:[SUA-SENHA]@db.[SEU-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
POSTGRES_PRISMA_URL="postgresql://postgres:[SUA-SENHA]@db.[SEU-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
POSTGRES_URL="postgresql://postgres:[SUA-SENHA]@db.[SEU-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true"

# Supabase API (opcional para futuras integrações)
NEXT_PUBLIC_SUPABASE_URL="https://[SEU-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[SUA-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[SUA-SERVICE-ROLE-KEY]"

# JWT Secret (mantenha o existente)
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# Next.js
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Outras configurações existentes...
```

### 4. Executar Migrações

```bash
# Gerar o cliente Prisma
npx prisma generate

# Executar migrações no Supabase
npx prisma migrate deploy

# Opcional: Popular banco com dados iniciais
npx prisma db seed
```

### 5. Testar Conexão

```bash
# Executar script de teste
node test-supabase-connection.js
```

## 🔍 Verificação no Supabase

1. Acesse **Table Editor** no dashboard do Supabase
2. Você deve ver as tabelas criadas:
   - `User`
   - `Category`
   - `Product`
   - `Order`
   - `OrderItem`
   - `Table`
   - etc.

## 🚀 Deploy em Produção

Para deploy em produção, configure as variáveis de ambiente no seu provedor de hospedagem:

1. Configure todas as variáveis do `.env.local`
2. Use `POSTGRES_PRISMA_URL` para conexões do Prisma
3. Certifique-se de que o banco está acessível pela aplicação

## 🔧 Troubleshooting

### Erro de Conexão
- Verifique se a senha está correta
- Confirme se o project-ref está correto na URL
- Teste a conexão com o script de teste

### Tabelas não Criadas
```bash
npx prisma migrate reset --force
npx prisma migrate deploy
```

### Erro de SSL
Adicione `?sslmode=require` na URL de conexão

## 📞 Suporte

Se encontrar problemas:
1. Execute o script de teste: `node test-supabase-connection.js`
2. Verifique os logs no Supabase Dashboard
3. Confirme as variáveis de ambiente

---

**Próximo passo**: Após configurar, execute `npm run dev` e teste as APIs de produtos e categorias!