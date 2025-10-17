# 🚀 Guia de Deploy na Vercel

## 📋 Pré-requisitos

- [x] Conta no GitHub
- [x] Conta na Vercel (grátis)
- [x] Banco de dados configurado (Supabase/Neon/PlanetScale)

---

## 1️⃣ Preparar Banco de Dados

### Opção A: Supabase (RECOMENDADO - 100% GRÁTIS)

1. **Criar conta**: https://supabase.com
2. **Novo projeto**:
   - Nome: `lanchonete-db`
   - Região: `South America (São Paulo)`
   - Senha forte (salve!)
3. **Aguardar** ~2 minutos para criar
4. **Copiar Connection String**:
   - Vá em `Settings` → `Database`
   - Copie `Connection string` (formato URI)
   - Substitua `[YOUR-PASSWORD]` pela senha que você criou

**Exemplo**:
```
postgresql://postgres.xxxxx:SUA_SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
```

### Opção B: Vercel Postgres (Neon)

1. No painel da Vercel, clique em `Storage`
2. `Create Database` → `Postgres`
3. Ao criar, defina o campo **Custom Prefix** para `DATABASE`
   - Isso faz com que as variáveis sejam criadas como:
     - `DATABASE_URL` (pooled)
     - `DATABASE_URL_NON_POOLING` (direta, ideal para migrations)
     - `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_HOST`, etc.
4. Nosso build já mapeia automaticamente `DIRECT_URL` a partir de `DATABASE_URL_NON_POOLING` durante o deploy.
   - Se preferir, você pode também criar manualmente uma variável `DIRECT_URL` com o mesmo valor de `DATABASE_URL_NON_POOLING`.

#### Gerar .env.vercel automaticamente (Supabase)

Para agilizar, você pode usar nosso script para gerar um arquivo `.env.vercel` completo para importação na Vercel:

```bash
node scripts/setup-env.js --provider supabase \
  --project-ref <PROJECT_REF> \
  --db-password <DB_PASSWORD> \
  --app-url https://seu-app.vercel.app \
  --nextauth-url https://seu-app.vercel.app \
  --pooler-host aws-1-sa-east-1.pooler.supabase.com \
  --app-name "Sabores Do Mundo"
```

O script cria `.env.vercel` com:
- DATABASE_URL (pooled/PgBouncer)
- DIRECT_URL (non-pooled, usado por Prisma Migrate)
- DATABASE_URL_NON_POOLING (compatibilidade)
- NEXTAUTH_URL, APP_URL, JWT/NEXTAUTH secrets, etc.

Depois, importe o conteúdo de `.env.vercel` em:
- Vercel → Project → Settings → Environment Variables (Preview & Production)
- Em seguida, faça Redeploy com Clear Build Cache.

---

## 2️⃣ Gerar Secrets (Chaves Secretas)

### No Windows (PowerShell):
```powershell
# JWT_SECRET
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# NEXTAUTH_SECRET  
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### No Linux/Mac:
```bash
# JWT_SECRET
openssl rand -base64 32

# NEXTAUTH_SECRET
openssl rand -base64 32
```

**Salve essas chaves!** Você vai precisar delas.

---

## 3️⃣ Push para GitHub

```bash
# 1. Commit todas as mudanças
git add .
git commit -m "Preparar para produção"

# 2. Push para GitHub
git push origin main
```

---

## 4️⃣ Deploy na Vercel

### Passo a Passo:

1. **Acesse**: https://vercel.com
2. **Login** com GitHub
3. **Add New** → **Project**
4. **Import** seu repositório `lanchonete-next`
5. **Configure**:
   - Framework Preset: `Next.js` (detectado automaticamente)
   - Root Directory: `./`
   - Build Command: `npm run build` (padrão)
   - Output Directory: `.next` (padrão)
   - Install Command: `npm install` (padrão)

6. **Environment Variables** (IMPORTANTE! ⚠️):

Clique em `Environment Variables` e adicione:

```env
# Database (Pooled)
DATABASE_URL = sua_connection_string_pooleada (Supabase PgBouncer, Neon/Vercel Postgres)

# Database (Direct/Non-Pooling) — usado por Prisma Migrate
DIRECT_URL = sua_connection_string_sem_pool
# Em Vercel Postgres, se você usar Custom Prefix = DATABASE,
# você pode apenas deixar que o build mapeie automaticamente
# DATABASE_URL_NON_POOLING -> DIRECT_URL.

# JWT Secret (cole a chave gerada)
JWT_SECRET = sua_chave_jwt_gerada

# NextAuth Secret (cole a chave gerada)
NEXTAUTH_SECRET = sua_chave_nextauth_gerada

# URLs do app (serão atualizadas após o deploy)
NEXTAUTH_URL = https://seu-app.vercel.app
APP_URL = https://seu-app.vercel.app

# Node Environment
NODE_ENV = production
```

7. **Deploy!** 🚀
   - Clique em `Deploy`
   - Aguarde ~2-3 minutos

---

## 5️⃣ Pós-Deploy

### 1. Atualizar NEXTAUTH_URL

Após o deploy, você receberá uma URL como:
```
https://lanchonete-next.vercel.app
```

**Atualize a variável**:
1. Vá em `Settings` → `Environment Variables`
2. Edite `NEXTAUTH_URL`
3. Cole a URL real: `https://seu-app.vercel.app`
4. **Redeploy**: Vá em `Deployments` → Clique nos 3 pontos → `Redeploy`

### 2. Rodar Migrations

Durante o deploy, o build já executa `prisma migrate deploy` automaticamente quando `DATABASE_URL` está definido.

Se precisar rodar manualmente (ex.: primeiro provisionamento), use o terminal local:
```bash
# Use a URL direta (non-pooling) para migrations
DIRECT_URL="sua_url_direta" DATABASE_URL="sua_url_pooleada" npx prisma migrate deploy
DATABASE_URL="sua_url_pooleada" npx prisma db seed
```

### 3. Testar!

1. Acesse: `https://seu-app.vercel.app`
2. Faça login com:
   - Email: `admin@lanchonete.com`
   - Senha: `admin123`
3. Teste todas as funcionalidades

---

## 🔒 Segurança

### Checklist:
- [x] `.env.local` no `.gitignore`
- [x] Senhas fortes para JWT e NextAuth
- [x] HTTPS automático (Vercel)
- [x] Headers de segurança configurados
- [x] NODE_ENV=production

---

## 📊 Monitoramento

### No Vercel:
- **Analytics**: Tráfego e performance
- **Logs**: Erros em tempo real
- **Deployments**: Histórico de versões

---

## 💰 Custos

### Setup Atual (100% GRÁTIS):
- ✅ Vercel Hobby: R$ 0/mês
- ✅ Supabase Free: R$ 0/mês
- ✅ Domínio .vercel.app: R$ 0/mês

**Total: R$ 0,00/mês**

### Limites Free Tier:
- **Vercel**: 100 GB bandwidth/mês
- **Supabase**: 500 MB database, 2 GB bandwidth

---

## 🔄 Updates Futuros

Para fazer updates:
```bash
# 1. Fazer mudanças no código
git add .
git commit -m "Descrição da mudança"
git push origin main

# 2. Vercel faz deploy automático! 🎉
```

---

## ❓ Problemas Comuns

### Erro de Database Connection:
- Verificar se `DATABASE_URL` está correta
- Verificar se migrations foram executadas
- Verificar se IP da Vercel está permitido no Supabase

### Erro 500:
- Verificar logs no Vercel Dashboard
- Verificar se todas as env vars estão configuradas

### Upload de Imagens não funciona:
- Usar serviço externo (Cloudinary, AWS S3, Vercel Blob)
- Vercel não persiste arquivos no filesystem

---

## 🎯 Próximos Passos

1. **Domínio Personalizado** (opcional):
   - Comprar domínio (.com.br)
   - Configurar DNS na Vercel

2. **Email Transacional** (opcional):
   - Resend.com (grátis até 100 emails/dia)
   - Para notificações de pedidos

3. **Upgrade para Pro** (quando necessário):
   - Mais bandwidth
   - Uso comercial oficial
   - Suporte prioritário

---

## 📞 Suporte

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs

---

✅ **Pronto! Seu sistema está em produção!** 🎉

