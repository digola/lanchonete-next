# 🚀 GUIA: CONFIGURAÇÃO VERCEL - VARIÁVEIS DE AMBIENTE

## 🚨 **PROBLEMA IDENTIFICADO**

O Vercel está usando **URL de banco incorreta**:
```
❌ INCORRETA: postgresql://postgres:D1g0l%40admin123@db.iqfsvbvkxrcoxallgoeo.supabase.co:5432/postgres
✅ CORRETA:   postgresql://postgres.myerftqwarctdkstiimu:JzHoKngaUq5OBFv0@db.myerftqwarctdkstiimu.supabase.co:5432/postgres
```

---

## 🔧 **CORREÇÕES REALIZADAS LOCALMENTE**

### ✅ **Arquivo .env.production Atualizado**
- `DATABASE_URL` ✅ Corrigida
- `POSTGRES_PRISMA_URL` ✅ Corrigida  
- `POSTGRES_URL` ✅ Corrigida
- `DIRECT_URL` ✅ Corrigida
- `SUPABASE_DB_URL` ✅ Corrigida

---

## 🌐 **CONFIGURAÇÃO NO PAINEL VERCEL**

### **PASSO 1: Acesse o Painel Vercel**
1. **Vá para:** https://vercel.com/dashboard
2. **Selecione:** Projeto `lanchonete-next`
3. **Clique em:** Settings → Environment Variables

### **PASSO 2: Atualize as Variáveis Críticas**

#### **🗄️ Database URLs (CRÍTICAS)**
```bash
DATABASE_URL="postgresql://postgres.myerftqwarctdkstiimu:JzHoKngaUq5OBFv0@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1&schema=public"

POSTGRES_PRISMA_URL="postgresql://postgres.myerftqwarctdkstiimu:JzHoKngaUq5OBFv0@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1&schema=public"

POSTGRES_URL="postgresql://postgres.myerftqwarctdkstiimu:JzHoKngaUq5OBFv0@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require"

DIRECT_URL="postgresql://postgres.myerftqwarctdkstiimu:JzHoKngaUq5OBFv0@db.myerftqwarctdkstiimu.supabase.co:5432/postgres?sslmode=require&schema=public"

SUPABASE_DB_URL="postgresql://postgres.myerftqwarctdkstiimu:JzHoKngaUq5OBFv0@db.myerftqwarctdkstiimu.supabase.co:5432/postgres?sslmode=require&schema=public"
```

#### **🌐 Supabase Client (Verificar se estão corretas)**
```bash
NEXT_PUBLIC_SUPABASE_URL="https://myerftqwarctdkstiimu.supabase.co"
SUPABASE_URL="https://myerftqwarctdkstiimu.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15ZXJmdHF3YXJjdGRrc3RpaW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzM2NzAsImV4cCI6MjA3NjY0OTY3MH0.wjVxipHXvaoa1GMq-NAVoZvvzvC7NEcY_wojuImm3QU"
```

### **PASSO 3: Configurar Ambientes**
- **Production:** ✅ Todas as variáveis acima
- **Preview:** ✅ Mesmas variáveis (opcional)
- **Development:** ❌ Não configurar (usa .env.local)

---

## 📋 **CHECKLIST DE VERIFICAÇÃO**

### **No Painel Vercel:**
- [ ] `DATABASE_URL` atualizada com senha `JzHoKngaUq5OBFv0`
- [ ] `POSTGRES_PRISMA_URL` atualizada
- [ ] `POSTGRES_URL` atualizada  
- [ ] `DIRECT_URL` atualizada
- [ ] `SUPABASE_DB_URL` atualizada
- [ ] Projeto Supabase correto: `myerftqwarctdkstiimu`
- [ ] Senha correta: `JzHoKngaUq5OBFv0`

### **URLs Incorretas para REMOVER:**
❌ Qualquer URL contendo:
- `db.iqfsvbvkxrcoxallgoeo.supabase.co`
- `D1g0l%40admin123`
- `LDePFClTOvkHqr43`

---

## 🚀 **APÓS CONFIGURAR NO VERCEL**

### **1. Fazer Deploy**
```bash
git add .
git commit -m "fix: corrigir URLs do banco para produção"
git push origin main
```

### **2. Verificar Deploy**
- **Aguarde:** Build automático no Vercel
- **Acesse:** https://lanchonete-pi.vercel.app
- **Teste:** Funcionalidades que usam banco

### **3. Monitorar Logs**
- **Vercel Dashboard:** Functions → View Function Logs
- **Procure por:** Erros de conexão com banco

---

## ⚠️ **IMPORTANTE**

1. **Senha Atual:** `JzHoKngaUq5OBFv0`
2. **Projeto Correto:** `myerftqwarctdkstiimu.supabase.co`
3. **Remover URLs antigas** do projeto `iqfsvbvkxrcoxallgoeo`

---

## 🔍 **VERIFICAÇÃO FINAL**

Após o deploy, os logs devem mostrar:
```
✅ DATABASE_URL being used: postgresql://postgres.myerftqwarctdkstiimu:JzHoKngaUq5OBFv0@...
✅ Conexão com banco estabelecida
✅ Sem erros de autenticação
```

**Status:** 🟡 **AGUARDANDO CONFIGURAÇÃO NO VERCEL**