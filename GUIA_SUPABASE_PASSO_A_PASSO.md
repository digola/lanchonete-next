# 🎯 Guia Passo a Passo - Supabase Dashboard

Este guia te mostra **exatamente onde** encontrar as informações no Supabase.

## 🚀 Passo 1: Acessar o Supabase

1. Abra seu navegador
2. Acesse: **https://supabase.com**
3. Clique em **"Sign In"** (canto superior direito)
4. Faça login com sua conta

## 📋 Passo 2: Criar Novo Projeto (se necessário)

### Se você NÃO tem projeto ainda:

1. **Na página inicial**, você verá um botão verde **"New Project"**
2. Clique em **"New Project"**
3. Preencha os campos:
   - **Name**: `Lanchonete Sistema`
   - **Database Password**: Crie uma senha forte (ex: `MinhaSenh@123`)
   - **Region**: Escolha `South America (São Paulo)`
   - **Pricing Plan**: Deixe "Free" selecionado
4. Clique em **"Create new project"**
5. **AGUARDE** 2-3 minutos para o projeto ser criado

### Se você JÁ tem um projeto:
1. Na lista de projetos, clique no seu projeto
2. Pule para o Passo 3

## 🔧 Passo 3: Encontrar as Credenciais

### 3.1 - Navegar para Database Settings

1. **No dashboard do projeto**, procure no menu lateral esquerdo
2. Clique em **"Settings"** (ícone de engrenagem)
3. No submenu que aparece, clique em **"Database"**

### 3.2 - Localizar Connection Info

Na página Database, você verá uma seção chamada **"Connection Info"**:

```
Connection Info
├── Host: db.abcdefghijk.supabase.co
├── Database name: postgres
├── Port: 5432
├── User: postgres
└── Password: [Sua senha definida]
```

### 3.3 - Copiar Connection String

**Mais abaixo na mesma página**, procure por **"Connection string"**:

Você verá algo como:
```
URI: postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijk.supabase.co:5432/postgres
```

**IMPORTANTE**: Substitua `[YOUR-PASSWORD]` pela senha que você definiu!

## 📝 Passo 4: Identificar Suas Informações

Do exemplo acima, você precisa identificar:

1. **PROJECT-REF**: `abcdefghijk` (parte entre `db.` e `.supabase.co`)
2. **SUA-SENHA**: A senha que você definiu na criação
3. **Connection String completa**

## ✏️ Passo 5: Editar .env.local

Abra o arquivo `.env.local` e substitua:

**ANTES:**
```env
DATABASE_URL="postgresql://postgres:[SUA-SENHA]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

**DEPOIS (exemplo real):**
```env
DATABASE_URL="postgresql://postgres:MinhaSenh@123@db.abcdefghijk.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

## 🎯 Exemplo Completo

Se suas informações forem:
- **PROJECT-REF**: `xyzabc123def`
- **SENHA**: `MinhaSenha456!`

Seu `.env.local` ficará:

```env
# Supabase Database URLs
DATABASE_URL="postgresql://postgres:MinhaSenha456!@db.xyzabc123def.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
POSTGRES_PRISMA_URL="postgresql://postgres:MinhaSenha456!@db.xyzabc123def.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
POSTGRES_URL="postgresql://postgres:MinhaSenha456!@db.xyzabc123def.supabase.co:5432/postgres?pgbouncer=true"

# Supabase API Keys (opcional)
NEXT_PUBLIC_SUPABASE_URL="https://xyzabc123def.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[encontre em Settings > API]"
SUPABASE_SERVICE_ROLE_KEY="[encontre em Settings > API]"
```

## 🚨 Problemas Comuns

### "Não encontro Connection Info"
- Certifique-se de estar em **Settings** → **Database**
- Se não aparecer, aguarde o projeto terminar de ser criado

### "Esqueci minha senha"
- Vá em **Settings** → **Database**
- Clique em **"Reset database password"**
- Defina uma nova senha

### "Project-REF não aparece"
- Olhe na URL do seu navegador: `https://supabase.com/dashboard/project/SEU-PROJECT-REF`
- Ou na Connection String: `db.SEU-PROJECT-REF.supabase.co`

## ✅ Próximo Passo

Após configurar o `.env.local`, execute:
```bash
node setup-supabase.js
```

---

**🆘 Precisa de mais ajuda?** Me diga em qual passo você está com dificuldade!