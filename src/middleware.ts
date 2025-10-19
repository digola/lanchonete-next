import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTokenEdge, hasMinimumRole } from './lib/auth-edge';
import { UserRole } from './types';

const PUBLIC_ROUTES = ['/login', '/register', '/', '/api/health', '/api/health/db'];
const STAFF_ROUTES = ['/staff', '/tables'];
const MANAGER_ROUTES = ['/expedicao'];
const ADMIN_ROUTES = ['/admin'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Permitir acesso a rotas de API públicas
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/admin') && !pathname.startsWith('/api/staff')) {
    return NextResponse.next();
  }

  // Permitir acesso a arquivos estáticos
  if (pathname.startsWith('/_next/') || pathname.startsWith('/uploads/') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // Verificar rotas públicas de forma mais robusta
  const isPublicRoute = PUBLIC_ROUTES.some(route => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname === route || pathname.startsWith(route + '/');
  });

  if (isPublicRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;

  if (!token) {
    // Redirecionar para login se não há token e a rota não é pública
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const decoded = verifyTokenEdge(token);

    if (!decoded || !decoded.userId || !decoded.role) {
      throw new Error('Token inválido ou incompleto');
    }

    // Verificar rotas de STAFF
    if (STAFF_ROUTES.some(route => pathname.startsWith(route))) {
      const allowedRolesForStaff = [
        UserRole.STAFF,
        UserRole.MANAGER,
        UserRole.ADMIN,
        UserRole.ADMINISTRADOR,
        UserRole.ADMINISTRADOR_LOWER,
        UserRole.ADMINISTRADOR_TITLE,
      ];
      if (!allowedRolesForStaff.includes(decoded.role)) {
        const forbiddenUrl = new URL('/', request.url);
        return NextResponse.redirect(forbiddenUrl);
      }
    }

    // Verificar rotas de MANAGER (permitir MANAGER e ADMIN/ADMINISTRADOR)
    if (MANAGER_ROUTES.some(route => pathname.startsWith(route))) {
      const allowedRolesForManager = [
        UserRole.MANAGER,
        UserRole.ADMIN,
        UserRole.ADMINISTRADOR,
        UserRole.ADMINISTRADOR_LOWER,
        UserRole.ADMINISTRADOR_TITLE,
      ];
      if (!allowedRolesForManager.includes(decoded.role)) {
        const forbiddenUrl = new URL('/', request.url);
        return NextResponse.redirect(forbiddenUrl);
      }
    }

    // Verificar rotas de ADMIN (permitir variações de ADMINISTRADOR)
    if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
      const allowedRolesForAdmin = [
        UserRole.ADMIN,
        UserRole.ADMINISTRADOR,
        UserRole.ADMINISTRADOR_LOWER,
        UserRole.ADMINISTRADOR_TITLE,
      ];
      if (!allowedRolesForAdmin.includes(decoded.role)) {
        const forbiddenUrl = new URL('/', request.url);
        return NextResponse.redirect(forbiddenUrl);
      }
    }

    // Adicionar headers de segurança
    const response = NextResponse.next();
    response.headers.set('X-User-ID', decoded.userId.toString());
    response.headers.set('X-User-Role', decoded.role);
    
    return response;
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    // Limpar cookies inválidos
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    response.cookies.delete('refreshToken');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads (uploaded files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|uploads).*)',
  ],
};
