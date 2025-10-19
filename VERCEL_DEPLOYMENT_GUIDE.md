# 🚀 Guia de Deploy no Vercel - Sistema Lanchonete

## 📋 Variáveis de Ambiente para Configurar no Vercel

Configure as seguintes variáveis de ambiente no painel do Vercel:

### 🗄️ Database Configuration
```
DATABASE_URL=postgresql://postgres:D1g0l%40admin123@db.iqfsvbvkxrcoxallgoeo.supabase.co:5432/postgres?sslmode=require
POSTGRES_PRISMA_URL=postgresql://postgres:D1g0l%40admin123@db.iqfsvbvkxrcoxallgoeo.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1&sslmode=require
POSTGRES_URL=postgresql://postgres:D1g0l%40admin123@db.iqfsvbvkxrcoxallgoeo.supabase.co:5432/postgres?sslmode=require
DIRECT_URL=postgresql://postgres:D1g0l%40admin123@db.iqfsvbvkxrcoxallgoeo.supabase.co:5432/postgres?sslmode=require
```

### 🌐 Supabase Client Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://iqfsvbvkxrcoxallgoeo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxZnN2YnZreHJjb3hhbGxnb2VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NDc1NTMsImV4cCI6MjA3NjQyMzU1M30.3tv15m6lII7JTSLQG3DyIm6uxDp3rQtS2BvKB7Iggfg
```

### 🔐 Authentication & Security
```
JWT_SECRET=lanchonete-super-secret-jwt-key-2024-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
NEXTAUTH_SECRET=lanchonete-super-secret-nextauth-key-2024-production
NEXTAUTH_URL=https://lanchonete-next.vercel.app
```

### 📱 Application Configuration
```
NODE_ENV=production
APP_NAME=Sistema Lanchonete
NEXT_PUBLIC_APP_URL=https://lanchonete-next.vercel.app
```

### 📁 Upload Configuration
```
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/webp
UPLOAD_DIR=/tmp/uploads/images
UPLOAD_BASE_URL=https://lanchonete-next.vercel.app/uploads/images
```

### ⚡ Performance & Optimization
```
NEXT_TELEMETRY_DISABLED=1
PRISMA_GENERATE_DATAPROXY=true
```

## 🔧 Passos para Deploy

1. **Conecte o repositório ao Vercel**
2. **Configure as variáveis de ambiente** (copie e cole as variáveis acima)
3. **Configure o Build Command**: `npm run build`
4. **Configure o Install Command**: `npm install`
5. **Deploy!**

## ⚠️ Pontos Importantes

- ✅ **SSL Mode**: Todas as conexões de banco incluem `sslmode=require` para segurança
- ✅ **Connection Pooling**: Configurado com PgBouncer para melhor performance
- ✅ **Supabase**: Configuração completa com URL e chave anônima
- ✅ **Prisma**: Configurado para usar DataProxy em produção

## 🐛 Resolução do Erro "Invalid Port Number"

O erro foi causado pela falta do parâmetro `sslmode=require` nas strings de conexão. 
Todas as conexões agora incluem este parâmetro obrigatório para Supabase em produção.

## 📊 Status do Banco de Dados

- **Categorias**: 5 cadastradas
- **Produtos**: 10 cadastrados  
- **Mesas**: 10 configuradas
- **Usuários**: 3 (admin, funcionário, cliente)
- **Configurações**: 6 definidas

## 🎯 URLs de Acesso

- **Produção**: https://lanchonete-next.vercel.app
- **Admin**: https://lanchonete-next.vercel.app/admin
- **Staff**: https://lanchonete-next.vercel.app/staff
- **Cliente**: https://lanchonete-next.vercel.app/customer