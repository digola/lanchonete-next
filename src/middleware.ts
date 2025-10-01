import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTokenEdge } from './lib/auth';
import { UserRole } from './types';

const PUBLIC_ROUTES = ['/login', '/register', '/'];
const STAFF_ROUTES = ['/staff', '/tables'];
const MANAGER_ROUTES = ['/expedicao'];
const ADMIN_ROUTES = ['/admin'];

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

    // Verificar rotas de STAFF
    if (STAFF_ROUTES.some(route => pathname.startsWith(route))) {
      if (decoded.role !== UserRole.STAFF && decoded.role !== UserRole.MANAGER && decoded.role !== UserRole.ADMIN) {
        const defaultRoute = new URL('/login', request.url);
        return NextResponse.redirect(defaultRoute);
      }
    }

    // Verificar rotas de MANAGER (apenas MANAGER)
    if (MANAGER_ROUTES.some(route => pathname.startsWith(route))) {
      if (decoded.role !== UserRole.MANAGER) {
        const defaultRoute = new URL('/login', request.url);
        return NextResponse.redirect(defaultRoute);
      }
    }

    // Verificar rotas de ADMIN
    if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
      if (decoded.role !== UserRole.ADMIN) {
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
