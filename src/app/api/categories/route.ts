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
      return NextResponse.json({ success: false, error: 'Sem permissão para editar categorias' }, { status: 403 });
    }

    // Verifica se a categoria existe
    const existingCategory = await prisma.category.findUnique({ where: { id } });
    if (!existingCategory) {
      return NextResponse.json({ success: false, error: 'Categoria não encontrada' }, { status: 404 });
    }

    // Extrai os dados do corpo da requisição
    const body = await request.json();
    const { name, description, color, isActive } = body;

    // Validações dos campos recebidos
    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ success: false, error: 'Nome é obrigatório' }, { status: 400 });
    }

    // Verifica duplicidade de nome (exceto se for o mesmo da categoria atual)
    if (name && name.trim() !== existingCategory.name) {
      const duplicate = await prisma.category.findUnique({ where: { name: name.trim() } });
      if (duplicate) {
        return NextResponse.json({ success: false, error: 'Já existe uma categoria com este nome' }, { status: 400 });
      }
    }

    // Valida formato da cor hexadecimal
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return NextResponse.json({ success: false, error: 'Cor inválida. Use hexadecimal (ex: #FF5733)' }, { status: 400 });
    }

    // Atualiza a categoria no banco de dados
    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(color !== undefined && { color: color.trim() }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            isAvailable: true,
          },
        },
      },
    });

    // Retorna a categoria atualizada
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Erro no PUT:', error.message || error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// 🗑️ DELETE /api/categories/[id]
// Remove uma categoria do banco de dados, se não houver produtos vinculados
export async function DELETE(request: NextRequest, context: RouteParams) {
  const { id } = context.params;
  console.log('[DELETE] /api/categories/[id] - ID recebido:', id);

  try {
    validateId(id); // Valida o ID recebido

    // 🔐 Autenticação
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Token não fornecido' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Token inválido ou expirado' }, { status: 401 });
    }

    // 🔒 Autorização
    if (!hasPermission(decoded.role, 'categories:delete')) {
      return NextResponse.json({ success: false, error: 'Sem permissão para deletar categorias' }, { status: 403 });
    }

    // Verifica se a categoria existe
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Categoria não encontrada' }, { status: 404 });
    }

    // Verifica se há produtos vinculados à categoria
    const productsCount = await prisma.product.count({ where: { categoryId: id } });
    if (productsCount > 0) {
      return NextResponse.json({
        success: false,
        error: 'Não é possível deletar categoria com produtos. Remova-os ou desative a categoria.',
      }, { status: 400 });
    }

    // Deleta a categoria
    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Categoria deletada com sucesso' });
  } catch (error: any) {
    console.error('Erro no DELETE:', error.message || error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
