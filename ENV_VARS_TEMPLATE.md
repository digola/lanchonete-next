# 🔐 Variáveis de Ambiente para Produção

## 📋 Template para Vercel Dashboard

Copie e cole essas variáveis em: **Vercel Dashboard → Settings → Environment Variables**

---

## 1️⃣ Database

```env
DATABASE_URL
DIRECT_URL
```
**Valor**:
- DATABASE_URL: use a conexão Pooled (PgBouncer) para o runtime da aplicação
- DIRECT_URL: use a conexão Direta (sem PgBouncer) para migrações do Prisma

**Onde obter (Supabase)**:
- Project Settings → Database → Connection string (URI)
- Pooled (porta 6543) → DATABASE_URL
- Direct (porta 5432) → DIRECT_URL

**Exemplos Supabase** (substitua SEUPROJECTREF e SUA_SENHA):
```
# Runtime (Pooled)
postgresql://postgres:SUA_SENHA@db.SEUPROJECTREF.supabase.co:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1&schema=public

# Migrações (Direto)
postgresql://postgres:SUA_SENHA@db.SEUPROJECTREF.supabase.co:5432/postgres?sslmode=require&schema=public
```

---

## 2️⃣ JWT Secret

```env
JWT_SECRET
```
**Valor**: Chave aleatória de 32+ caracteres

**Gerar**:
```bash
# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Linux/Mac
openssl rand -base64 32

# Node.js
node scripts/generate-secrets.js
```

**Exemplo**:
```
a8f3k2j9d7s6h4g1m5n8b3v2c7x9z4q1w6e8r5t2y7u3i9o0p4l6k2j8h5g3f1d
```

---

## 3️⃣ NextAuth Secret

```env
NEXTAUTH_SECRET
```
**Valor**: Chave aleatória de 32+ caracteres (diferente do JWT_SECRET)

**Gerar**: Use os mesmos comandos acima

**Exemplo**:
```
z4x9c7v2b8n3m5g1h6s4d2j9k3f7l1p6o0i9u3y2t7r5e8w6q1a4k2j8h5g3f1d
```

---

## 4️⃣ NextAuth URL

```env
NEXTAUTH_URL
```
**Valor**: URL da sua aplicação na Vercel

**Importante**: Você precisa atualizar isso APÓS o primeiro deploy!

**Primeiro deploy** (temporário):
```
https://seu-app.vercel.app
```

**Após deploy** (atualizar para URL real):
```
https://lanchonete-next-seu-usuario.vercel.app
```

---

## 5️⃣ App URL

```env
APP_URL
```
**Valor**: Igual ao NEXTAUTH_URL (use https em produção)

**Exemplos**:
```
# Development
APP_URL="http://localhost:3000"

# Preview / Production
APP_URL="https://seu-app.vercel.app"  # ou seu domínio
```

---

## 6️⃣ Node Environment

```env
NODE_ENV
```
**Valor**:
```
production
```

---

## ✅ Checklist de Configuração

- [ ] DATABASE_URL (Pooled) configurada e testada
- [ ] DIRECT_URL (Direta) configurada
- [ ] JWT_SECRET gerado (32+ caracteres)
- [ ] NEXTAUTH_SECRET gerado (32+ caracteres, diferente do JWT)
- [ ] NEXTAUTH_URL configurada
- [ ] APP_URL configurada
- [ ] NODE_ENV=production
- [ ] Todas as variáveis salvas no Vercel
- [ ] Deploy realizado
- [ ] NEXTAUTH_URL atualizada com URL real
- [ ] Redeploy após atualizar NEXTAUTH_URL
- [ ] Migrations executadas (`npx prisma migrate deploy`)
- [ ] Seed executado (`npx prisma db seed`)

---

## 🔧 Como Configurar no Vercel

1. Acesse seu projeto no Vercel
2. Vá em **Settings** (aba superior)
3. Clique em **Environment Variables** (menu lateral)
4. Para cada variável:
   - Clique em **Add**
   - Cole o **Nome** (ex: `DATABASE_URL`)
   - Cole o **Valor** (ex: a connection string)
   - Selecione **Production, Preview, Development** (adicione pelo menos Preview e Production)
   - Clique em **Save**

---

## 🚨 Importante

- ⚠️ **NUNCA** commite valores reais no Git
- ⚠️ Guarde os secrets em local seguro (gerenciador de senhas)
- ⚠️ Use secrets diferentes para cada ambiente
- ⚠️ Após atualizar variáveis, faça **Redeploy**

---

## 📝 Exemplo Completo

```env
DATABASE_URL="postgresql://postgres:SENHA@db.SEUPROJECTREF.supabase.co:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1&schema=public"
DIRECT_URL="postgresql://postgres:SENHA@db.SEUPROJECTREF.supabase.co:5432/postgres?sslmode=require&schema=public"
JWT_SECRET="a8f3k2j9d7s6h4g1m5n8b3v2c7x9z4q1w6e8r5t2y7u3i9o0p4l6k2j8h5g3f1d"
NEXTAUTH_SECRET="z4x9c7v2b8n3m5g1h6s4d2j9k3f7l1p6o0i9u3y2t7r5e8w6q1a4k2j8h5g3f1d"
NEXTAUTH_URL="https://lanchonete-next.vercel.app"
APP_URL="https://lanchonete-next.vercel.app"
NODE_ENV="production"
```

---

✅ Configuração completa! Pronto para deploy! 🚀

