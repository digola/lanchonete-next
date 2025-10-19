# 🚀 Solução Rápida - Resolver Erro Agora!

Entendo sua frustração! Vamos resolver isso **AGORA** sem complicações.

## ⚡ Opção 1: SQLite (Mais Rápida)

### 1. Editar .env.local
```env
# SQLite - Funciona imediatamente
DATABASE_URL="file:./dev.db"
POSTGRES_PRISMA_URL="file:./dev.db"
POSTGRES_URL="file:./dev.db"

# Auth secrets (mantenha estes)
JWT_SECRET=dev-jwt-secret
NEXTAUTH_SECRET=dev-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

### 2. Executar comandos
```bash
npx prisma migrate reset --force
npx prisma generate
npx prisma migrate deploy
```

**PRONTO! Sistema funcionando em 30 segundos.**

---

## ⚡ Opção 2: PostgreSQL Online Grátis

### 1. Acesse: https://neon.tech
- Clique "Sign Up"
- Use GitHub/Google para login rápido
- Crie projeto: "lanchonete"

### 2. Copie a Connection String
Algo como:
```
postgresql://user:pass@ep-cool-lab-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 3. Cole no .env.local
```env
DATABASE_URL="SUA_STRING_AQUI"
POSTGRES_PRISMA_URL="SUA_STRING_AQUI"
POSTGRES_URL="SUA_STRING_AQUI"
```

### 4. Execute
```bash
npx prisma migrate deploy
```

**PRONTO! Sistema funcionando em 2 minutos.**

---

## ⚡ Opção 3: Usar Banco Existente

Se você já tem PostgreSQL instalado:

```env
DATABASE_URL="postgresql://postgres:sua_senha@localhost:5432/lanchonete_db"
```

---

## 🎯 Qual Escolher?

- **SQLite**: Mais rápido, para desenvolvimento
- **Neon.tech**: PostgreSQL grátis na nuvem
- **Local**: Se já tem PostgreSQL

## 🚀 Depois de Escolher

1. Edite `.env.local`
2. Execute: `npx prisma migrate deploy`
3. Teste: Acesse http://localhost:3000

**O erro vai sumir imediatamente!**

---

**Qual opção você quer? Responda apenas:**
- "1" para SQLite
- "2" para Neon.tech  
- "3" para PostgreSQL local