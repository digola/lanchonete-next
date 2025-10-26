# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [0.1.0] - 2025-10-26

### Adicionado
- Release inicial após reset do repositório
- Proteções de rota com Middleware e ProtectedRoute
- Hierarquia de papéis: CUSTOMER/CLIENTE, STAFF, MANAGER, ADMIN/ADMINISTRADOR
- Páginas principais: Admin (dashboard, users, etc.), Staff (mesas), Customer (dashboard, perfil), Expedicao (gestão de pedidos)
- APIs de pedidos e mesas com validações de autorização
- Store de autenticação (Zustand) e libs de auth com JWT
- Build e lint com scripts padronizados

### Melhorias
- Organização de permissões e papéis consistentes entre frontend e backend
- Preparação para CI e status checks (type-check, lint, build)

## [1.0.0] - 2025-01-23

### Adicionado
- Sistema completo de gestão para lanchonetes
- Autenticação JWT com 3 roles (Cliente, Funcionário, Administrador)
- APIs RESTful completas para todos os recursos
- Interface administrativa com CRUD completo
- Área do cliente com pedidos e perfil
- Área do funcionário com gestão de pedidos e mesas
- Sistema de carrinho persistente
- Banco de dados SQLite com Prisma ORM
- Design responsivo com Tailwind CSS
- Testes completos e funcionais

### Funcionalidades
- ✅ Cadastro e login de usuários
- ✅ Gestão de produtos e categorias
- ✅ Sistema de pedidos completo
- ✅ Gestão de mesas
- ✅ Relatórios e estatísticas
- ✅ Interface responsiva
- ✅ Sistema de permissões granular

### Tecnologias
- Next.js 15 (App Router)
- TypeScript
- Prisma ORM + SQLite
- Tailwind CSS
- JWT Authentication
- Zustand (State Management)
- React Hook Form + Zod
