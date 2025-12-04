import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTokenEdge, hasMinimumRole } from './lib/auth';
import { UserRole } from './types';

const PUBLIC_ROUTES = ['/login', '/register', '/'];
const STAFF_ROUTES = ['/staff', '/tables'];
const MANAGER_ROUTES = ['/expedicao'];
const ADMIN_ROUTES = ['/admin'];
const STAFF_ALLOWED = [UserRole.STAFF, UserRole.ADMIN];
const MANAGER_ALLOWED = [UserRole.MANAGER, UserRole.ADMIN];
const ADMIN_ALLOWED = [UserRole.ADMIN];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Permitir acesso a rotas públicas
  if (PUBLIC_ROUTES.includes(pathname)) {
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

    if (!decoded) {
      throw new Error('Token inválido');
    }

    if (STAFF_ROUTES.some(route => pathname.startsWith(route))) {
      const role = decoded.role as UserRole;
      if (!STAFF_ALLOWED.includes(role)) {
        const defaultRoute = new URL('/login', request.url);
        return NextResponse.redirect(defaultRoute);
      }
    }

    if (MANAGER_ROUTES.some(route => pathname.startsWith(route))) {
      const role = decoded.role as UserRole;
      if (!MANAGER_ALLOWED.includes(role)) {
        const defaultRoute = new URL('/login', request.url);
        return NextResponse.redirect(defaultRoute);
      }
    }

    if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
      const role = decoded.role as UserRole;
      if (!ADMIN_ALLOWED.includes(role)) {
        const defaultRoute = new URL('/login', request.url);
        return NextResponse.redirect(defaultRoute);
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|uploads).*)'],
};
