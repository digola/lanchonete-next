# 🍔 Lanchonete Next — Ambiente Local Simplificado

Sistema de gestão para lanchonetes e restaurantes desenvolvido em Next.js 15, TypeScript, Prisma e Tailwind CSS. Este repositório está configurado para desenvolvimento local usando SQLite (sem PostgreSQL).

## 🚀 Principais funcionalidades
- Usuários com roles: CLIENTE, FUNCIONARIO, ADMINISTRADOR
- Gestão de categorias e produtos
- Pedidos com itens, status e histórico
- Controle de mesas (livre/ocupada/reservada/manutenção)
- Autenticação via JWT
- Interface responsiva (Tailwind CSS)

## 🛠️ Stack
- Frontend/Backend: Next.js (App Router)
- ORM: Prisma
- Banco local: SQLite (prisma/dev.db)
- Estado: Zustand
- Ícones: Lucide + Heroicons

## 📋 Requisitos
- Node.js 18+
- npm

## ⚙️ Configuração (local)
1) Instalar dependências
```bash
npm install
```

2) Preparar banco de dados (SQLite)
```bash
# Sincroniza o schema com o banco local
npm run db:push

# Popula dados iniciais (usuários, categorias, produtos, mesas)
npm run db:seed
```

3) Rodar em desenvolvimento
```bash
npm run dev
```
Acesse: http://localhost:3000/

## 🔐 Variáveis de ambiente
Crie um arquivo `.env` (ou `.env.local`) se desejar customizar segredos:
```env
# Opcional — se não definir, um fallback será usado
JWT_SECRET="uma-chave-secreta-segura"
# Expirações opcionais
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"
```
Observação: Para o ambiente local, o Prisma usa automaticamente `file:./dev.db` (SQLite).

## 👤 Usuários criados pelo seed
- admin@lanchonete.com (senha: 123456) — ADMINISTRADOR
- funcionario@lanchonete.com (senha: 123456) — FUNCIONARIO
- cliente@lanchonete.com (senha: 123456) — CLIENTE

## 📁 Estrutura (resumo)
```
src/
├─ app/            # Rotas/pages e APIs
├─ components/     # Componentes
├─ hooks/          # Hooks
├─ lib/            # Prisma, auth, utils
├─ stores/         # Zustand
└─ types/          # Tipos
prisma/
├─ schema.prisma   # Schema SQLite
└─ seed.ts         # Seed inicial
```

## 🗂️ Uploads
Uploads de imagens são salvos em `public/uploads/images`. A pasta já existe no repositório.

## 📜 Scripts úteis
```bash
npm run dev        # Desenvolvimento
npm run build      # Build
npm run start      # Produção local
npm run db:push    # Sincronizar schema (SQLite)
npm run db:seed    # Popular banco
npm run db:studio  # Prisma Studio
```

## 📝 Licença
MIT. Veja o arquivo LICENSE.

## Observações
- Este repositório está focado em ambiente local (SQLite). Integrações de produção foram removidas para simplificar.
- Se desejar migrar para Postgres no futuro, será necessário ajustar `DATABASE_URL` e reintroduzir migrations conforme sua necessidade.
