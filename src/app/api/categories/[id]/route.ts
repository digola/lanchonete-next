import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken, hasPermission } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/categories/[id] - Buscar categoria específica
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

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

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Categoria não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/categories/[id] - Atualizar categoria
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // Verificar autenticação
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Verificar permissão
    if (!hasPermission(decoded.role, 'categories:write')) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para editar categorias' },
        { status: 403 }
      );
    }

    // Verificar se a categoria existe
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Categoria não encontrada' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description, imageUrl, color, isActive } = body;

    // Validações
    if (name !== undefined && !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se já existe categoria com o mesmo nome (exceto a atual)
    if (name && name.trim() !== existingCategory.name) {
      const duplicateCategory = await prisma.category.findUnique({
        where: { name: name.trim() },
      });

      if (duplicateCategory) {
        return NextResponse.json(
          { success: false, error: 'Já existe uma categoria com este nome' },
          { status: 400 }
        );
      }
    }

    // Validar cor hexadecimal
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return NextResponse.json(
        { success: false, error: 'Cor deve ser um código hexadecimal válido (ex: #FF5733)' },
        { status: 400 }
      );
    }

    // Atualizar categoria
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl?.trim() || null }),
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

    // Log da atividade (comentado para SQLite - modelo activityLog não existe)
    // await prisma.activityLog.create({
    //   data: {
    //     userId: decoded.userId,
    //     action: 'UPDATE_CATEGORY',
    //     entityType: 'Category',
    //     entityId: id,
    //     details: JSON.stringify({
    //       oldData: existingCategory,
    //       newData: updatedCategory,
    //     }),
    //     ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    //     userAgent: request.headers.get('user-agent'),
    //   },
    // });

    return NextResponse.json({
      success: true,
      data: updatedCategory,
    });
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Deletar categoria
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // Verificar autenticação
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Verificar permissão
    if (!hasPermission(decoded.role, 'categories:delete')) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para deletar categorias' },
        { status: 403 }
      );
    }

    // Verificar se a categoria existe
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Categoria não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se a categoria tem produtos
    const productsCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productsCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não é possível deletar categoria que possui produtos. Remova os produtos primeiro ou desative a categoria.' 
        },
        { status: 400 }
      );
    }

    // Deletar categoria
    await prisma.category.delete({
      where: { id },
    });

    // Log da atividade (comentado para SQLite - modelo activityLog não existe)
    // await prisma.activityLog.create({
    //   data: {
    //     userId: decoded.userId,
    //     action: 'DELETE_CATEGORY',
    //     entityType: 'Category',
    //     entityId: id,
    //     details: JSON.stringify({
    //       name: existingCategory.name,
    //       icon: existingCategory.icon,
    //     }),
    //     ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    //     userAgent: request.headers.get('user-agent'),
    //   },
    // });

    return NextResponse.json({
      success: true,
      message: 'Categoria deletada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}