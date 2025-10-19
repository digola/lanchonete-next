# 🚀 Configuração de Variáveis de Ambiente no Vercel

## Variáveis Obrigatórias para Produção

Configure as seguintes variáveis de ambiente no painel do Vercel:

### 🔐 Autenticação e Segurança
```
JWT_SECRET=lanchonete-super-secret-jwt-key-2024-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
NEXTAUTH_SECRET=lanchonete-super-secret-nextauth-key-2024-production
NEXTAUTH_URL=https://seu-dominio.vercel.app
```

### 🗄️ Banco de Dados (Supabase)
```
DATABASE_URL=postgresql://postgres:D1g0l%40admin123@db.iqfsvbvkxrcoxallgoeo.supabase.co:5432/postgres
POSTGRES_PRISMA_URL=postgresql://postgres:D1g0l%40admin123@db.iqfsvbvkxrcoxallgoeo.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
POSTGRES_URL=postgresql://postgres:D1g0l%40admin123@db.iqfsvbvkxrcoxallgoeo.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:D1g0l%40admin123@db.iqfsvbvkxrcoxallgoeo.supabase.co:5432/postgres
```

### 🌐 Supabase Client
```
NEXT_PUBLIC_SUPABASE_URL=https://iqfsvbvkxrcoxallgoeo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxZnN2YnZreHJjb3hhbGxnb2VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NDc1NTMsImV4cCI6MjA3NjQyMzU1M30.3tv15m6lII7JTSLQG3DyIm6uxDp3rQtS2BvKB7Iggfg
```

### 📱 Configuração da Aplicação
```
NODE_ENV=production
APP_NAME=Sistema Lanchonete
APP_URL=https://seu-dominio.vercel.app
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
NEXT_PUBLIC_API_URL=https://seu-dominio.vercel.app/api
NEXT_PUBLIC_APP_NAME=Sistema Lanchonete
```

### 📁 Upload e Arquivos
```
UPLOAD_DIR=./public/uploads/images
UPLOAD_BASE_URL=https://seu-dominio.vercel.app/uploads/images
UPLOAD_MAX_SIZE=10485760
MAX_FILE_SIZE=5242880
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/webp
```

### ⚡ Rate Limiting
```
RATE_LIMIT_UPLOAD_IMAGE_MAX=20
RATE_LIMIT_UPLOAD_IMAGE_WINDOW_MS=60000
```

### 🔧 Configurações de Sistema
```
ENABLE_CACHE_LOGS=false
NEXT_TELEMETRY_DISABLED=1
```

### 👤 Admin User (para scripts)
```
ADMIN_EMAIL=admin@lanchonete.com
ADMIN_PASS=Admin@12345
ADMIN_NAME=Administrador Sistema
```

## 📋 Como Configurar no Vercel

1. **Acesse o painel do Vercel**
   - Vá para [vercel.com](https://vercel.com)
   - Faça login na sua conta

2. **Selecione seu projeto**
   - Clique no projeto `lanchonete-next`

3. **Acesse as configurações**
   - Clique em "Settings" no menu superior
   - Selecione "Environment Variables" no menu lateral

4. **Adicione as variáveis**
   - Para cada variável listada acima:
     - Clique em "Add New"
     - Digite o nome da variável (ex: `JWT_SECRET`)
     - Digite o valor da variável
     - Selecione os ambientes: `Production`, `Preview`, `Development`
     - Clique em "Save"

5. **Redeploy da aplicação**
   - Vá para a aba "Deployments"
   - Clique nos três pontos do último deployment
   - Selecione "Redeploy"

## 🚀 Importação Rápida do .env.local

Você pode copiar todas as variáveis do seu arquivo `.env.local` local e importar no Vercel:

1. **Copie o conteúdo do .env.local**
2. **No Vercel, vá para Environment Variables**
3. **Clique em "Import from .env"**
4. **Cole o conteúdo e ajuste os valores para produção:**
   - Altere `http://localhost:3000` para `https://seu-dominio.vercel.app`
   - Mantenha as credenciais do Supabase
   - Ajuste `NODE_ENV=production`

## ⚠️ Pontos Importantes

- **NUNCA** commite as variáveis de ambiente no código
- Use valores diferentes para produção e desenvolvimento
- O `NEXTAUTH_URL` deve ser o domínio real do Vercel
- O `NEXT_PUBLIC_APP_URL` deve ser o domínio real do Vercel
- Mantenha os secrets seguros e únicos

## 🔍 Verificação

Após configurar, teste:
1. `https://seu-dominio.vercel.app/api/health` - deve retornar `{"status":"ok","db":"ok"}`
2. `https://seu-dominio.vercel.app/register` - deve carregar a página sem erros
3. `https://seu-dominio.vercel.app/login` - deve carregar a página sem erros

## 🛠️ Troubleshooting

Se ainda houver erros:
1. Verifique se todas as variáveis foram configuradas
2. Confirme se os valores estão corretos (sem espaços extras)
3. Verifique se o redeploy foi feito após adicionar as variáveis
4. Consulte os logs do Vercel em "Functions" > "View Function Logs"

## 📝 Lista Completa de Variáveis

Para facilitar a importação, aqui está a lista completa das variáveis que devem estar no Vercel:

```
DATABASE_URL
POSTGRES_PRISMA_URL
POSTGRES_URL
DIRECT_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
JWT_SECRET
JWT_EXPIRES_IN
JWT_REFRESH_EXPIRES_IN
NEXTAUTH_SECRET
NEXTAUTH_URL
NODE_ENV
APP_NAME
APP_URL
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_APP_NAME
UPLOAD_DIR
UPLOAD_BASE_URL
UPLOAD_MAX_SIZE
MAX_FILE_SIZE
UPLOAD_ALLOWED_TYPES
RATE_LIMIT_UPLOAD_IMAGE_MAX
RATE_LIMIT_UPLOAD_IMAGE_WINDOW_MS
ENABLE_CACHE_LOGS
NEXT_TELEMETRY_DISABLED
ADMIN_EMAIL
ADMIN_PASS
ADMIN_NAME
```