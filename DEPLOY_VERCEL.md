# Guia de Deploy no Vercel (Next.js + Prisma)

Este guia descreve como publicar o projeto Next.js no Vercel, cobrindo pré-requisitos, configuração de variáveis de ambiente, banco de dados (Prisma), comandos de build, migrações e boas práticas para produção.

## Escopo
- Projeto com App Router (`src/app`), APIs internas e Prisma (`prisma/`).
- Deploy com Vercel (Preview e Production).
- Banco recomendado em produção: PostgreSQL.

## Pré-requisitos
- Repositório hospedado (GitHub/GitLab/Bitbucket).
- Conta no Vercel e acesso ao repositório.
- Banco de dados de produção (PostgreSQL gerenciado ou Vercel Postgres).
- `.env` alinhado ao `env.example` e `ENV_VARS_TEMPLATE.md`.

## Checklist Local
1. Instalar dependências: `npm ci`
2. Gerar Prisma Client: `npx prisma generate`
3. Build produção: `npm run build`
4. Rodar e validar rotas: `npm start` (ou `next start`) e testar páginas e APIs críticas.

## Importar Projeto no Vercel
1. Acesse `https://vercel.com/new` e clique em "Import Project".
2. Selecione o repositório e a branch de produção (ex.: `main` ou `stable/persistencia-completa`).
3. O Vercel detecta `Next.js` automaticamente.
4. Build Command padrão: `npm run build`.
5. Output: `.next` (padrão). Não precisa configurar manualmente.

## Variáveis de Ambiente
Defina em Settings > Environment Variables (Production e Preview). Baseie-se no `env.example` e `ENV_VARS_TEMPLATE.md`.

Exemplos comuns:
- `DATABASE_URL` (PostgreSQL produção)
- `NEXT_PUBLIC_*` (variáveis públicas usadas no cliente)
- Segredos de autenticação (ex.: `JWT_SECRET`, `AUTH_*`)

CLI opcional:
- `vercel env add KEY production`
- `vercel env add KEY preview`
- `vercel env pull .env` (sincronizar env local)

## Banco de Dados (Prisma)
- Em produção, preferir PostgreSQL. O repositório possui `schema-postgresql.prisma` e `scripts/switch-schema.js` caso deseje alternar.
- Migrações em produção:
  - Execute: `npx prisma migrate deploy` usando `DATABASE_URL` de produção.
  - Pode ser incluído no `build` para automatizar (ver abaixo).
- Conexões em ambiente serverless:
  - Use pool (PgBouncer) ou Prisma Data Proxy para estabilidade.
  - Alternativa: Vercel Postgres (gerenciado).

## Comando de Build recomendado
No `package.json`, ajuste o script de build para:

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

Isso garante que o Prisma Client esteja gerado e migrações estejam aplicadas antes do build.

## Runtime e Compatibilidade (Node.js)
- Prisma requer runtime Node (não Edge). Em rotas/API que usam Prisma, se necessário, declare:

```ts
export const runtime = 'nodejs';
```

- Evite operações de escrita no filesystem local em produção. Para uploads, use provedores externos (S3, Cloud Storage). A pasta `public/uploads` é estática; para upload dinâmico, migre para armazenamento externo.

## Configurações do Next
- Verifique `next.config.js` (domínios de imagens, configs específicas).
- `middleware.ts` funciona no Vercel; garanta que trechos que acessam DB rodem em runtime Node.

## Deploy
1. Clique em `Deploy` e acompanhe os logs de build.
2. Acesse a URL de Preview gerada (`https://<project>.vercel.app/`).
3. Valide páginas e APIs críticas (ex.: `/admin/orders`, endpoints `src/app/api/*`).

## Domínios & Produção
- Adicione domínio em Settings > Domains > `seu-dominio.com`.
- DNS: `CNAME` para `cname.vercel-dns.com`.
- Fluxos comuns:
  - Deploys em Preview para PRs.
  - Merge na branch de produção dispara deploy Production.

## CI/CD
- Cada push na branch configurada faz um deploy.
- Use proteção de branch e revisões de PR para qualidade.
- Tenha ambientes separados para Preview e Production com variáveis distintas.

## Observabilidade e Logs
- Use Vercel Logs/Observability para inspeção de erros.
- Registre erros em APIs e forneça mensagens claras ao cliente.

## Playbook de Erros Comuns
- Erro Prisma durante build:
  - Verifique `DATABASE_URL`.
  - Rode `prisma migrate deploy` manualmente.
  - Confirme runtime Node nas rotas com DB.
- Variáveis faltantes:
  - Compare com `env.example` e corrija em Settings.
- Conexões saturadas:
  - Configure pool de conexões ou Data Proxy.

## Comandos Úteis
- `npm ci` — instalar dependências com lockfile
- `npx prisma generate` — gerar Prisma Client
- `npx prisma migrate deploy` — aplicar migrações pendentes
- `npm run build` — build de produção
- `vercel` — deploy de Preview
- `vercel --prod` — deploy de produção

## Exemplo de vercel.json
O repositório já inclui `vercel.json`. Caso queira adaptar:

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm ci",
  "outputDirectory": ".next",
  "regions": ["iad1", "sfo1"],
  "headers": []
}
```

Personalize conforme suas necessidades (regiões, headers, etc.).

## Boas Práticas
- Mantenha `env.example` atualizado.
- Nunca versione segredos; use Variables no Vercel.
- Valide `npm run build` antes de merges.
- Otimize queries (ver `src/lib/queryOptimizer.ts`) e inclua `include*` nos endpoints quando necessário.
- Adote monitoramento e alertas para erros críticos.

---

Em caso de dúvidas, utilize os documentos de produção no repositório (`README_PRODUCTION.md`, `PRODUCTION_CHECKLIST.md`, `PRODUCTION_OPTIMIZATIONS.md`) como complemento a este guia.