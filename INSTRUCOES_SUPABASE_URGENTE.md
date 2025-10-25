# 🚨 INSTRUÇÕES URGENTES - CONFIGURAÇÃO SUPABASE

## ⚡ PROBLEMA IDENTIFICADO
As credenciais atuais do banco de dados **NÃO FUNCIONAM**. É necessário configurar o novo usuário no painel do Supabase.

## 🎯 NOVO USUÁRIO CRIADO
- **Email:** `digolanet@gmail.com`
- **Senha:** `admin123`

## 📋 PASSOS OBRIGATÓRIOS (FAÇA AGORA)

### 1. 🔐 ACESSAR PAINEL SUPABASE
```
URL: https://supabase.com/dashboard
Login: digolanet@gmail.com
Senha: admin123
```

### 2. 🔧 RESETAR SENHA DO BANCO
1. No painel, selecione o projeto `myerftqwarctdkstiimu`
2. Vá em **Settings** → **Database**
3. Clique em **"Reset database password"**
4. **COPIE A NOVA SENHA GERADA** (será algo como: `XyZ123AbC456...`)

### 3. 📝 ATUALIZAR .env.local
Substitua `admin123` pela nova senha nas linhas:

```env
# ANTES (não funciona):
DATABASE_URL="postgresql://postgres.myerftqwarctdkstiimu:admin123@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1&schema=public"
DIRECT_URL="postgresql://postgres.myerftqwarctdkstiimu:admin123@db.myerftqwarctdkstiimu.supabase.co:5432/postgres?sslmode=require&schema=public"

# DEPOIS (com nova senha do Supabase):
DATABASE_URL="postgresql://postgres.myerftqwarctdkstiimu:NOVA_SENHA_AQUI@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1&schema=public"
DIRECT_URL="postgresql://postgres.myerftqwarctdkstiimu:NOVA_SENHA_AQUI@db.myerftqwarctdkstiimu.supabase.co:5432/postgres?sslmode=require&schema=public"
```

### 4. ✅ TESTAR CONEXÃO
Execute o comando:
```bash
node update-database-user.js
```

## 🔍 VERIFICAÇÕES ADICIONAIS

### A. Verificar Status do Projeto
- Projeto deve estar **ATIVO** (não pausado)
- Se pausado, clique em **"Unpause project"**

### B. Verificar Permissões
- Usuário `digolanet@gmail.com` deve ter permissões de **Owner** ou **Admin**

### C. Verificar Região
- Projeto deve estar na região **South America (São Paulo)**

## 🚀 APÓS CORRIGIR

1. **Testar Prisma:**
   ```bash
   npx prisma migrate status
   npx prisma generate
   ```

2. **Criar usuário admin na aplicação:**
   ```bash
   node update-database-user.js
   ```

3. **Testar aplicação:**
   ```bash
   npm run dev
   ```

## ⚠️ IMPORTANTE
- **NÃO** use `admin123` como senha do banco
- **USE** a senha gerada pelo Supabase
- **MANTENHA** `admin123` como senha do usuário da aplicação

## 📞 SE AINDA NÃO FUNCIONAR

1. Verifique se o projeto Supabase não foi deletado
2. Crie um novo projeto se necessário
3. Atualize todas as URLs e chaves no `.env.local`

---
**Status:** 🔴 CRÍTICO - Requer ação imediata
**Prioridade:** MÁXIMA