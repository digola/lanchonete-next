import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken, hasPermission } from '@/lib/auth-server';

export const runtime = 'nodejs';

interface RouteParams {
  params: {
    id: string;
  };
}

// Função utilitária para validar o ID da categoria
function validateId(id: string) {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('ID da categoria é inválido ou ausente');
  }
}

// 📘 GET /api/categories/[id]
// Busca uma categoria específica pelo ID, incluindo os produtos relacionados
export async function GET(request: NextRequest, context: RouteParams) {
  const { id } = context.params;
  console.log('[GET] /api/categories/[id] - ID recebido:', id);

  try {
    validateId(id); // Valida o ID recebido

    // Busca a categoria no banco de dados
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            isAvailable: true,
            imageUrl: true,
          },
        },
      },
    });

    // Retorna erro 404 se a categoria não for encontrada
    if (!category) {
      console.warn('Categoria não encontrada:', id);
      return NextResponse.json({ success: false, error: 'Categoria não encontrada' }, { status: 404 });
    }

    // Retorna a categoria encontrada
    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    console.error('Erro no GET:', error.message || error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ✏️ PUT /api/categories/[id]
// Atualiza os dados de uma categoria existente
export async function PUT(request: NextRequest, context: RouteParams) {
  const { id } = context.params;
  console.log('[PUT] /api/categories/[id] - ID recebido:', id);

  try {
    validateId(id); // Valida o ID recebido

    // 🔐 Autenticação: extrai e verifica o token
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Token não fornecido' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Token inválido ou expirado' }, { status: 401 });
    }

    // 🔒 Autorização: verifica se o usuário tem permissão para editar categorias
    if (!hasPermission(decoded.role, 'categories:write')) {
      return NextResponse.json({ success: false
