import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products/[id]/adicionais
 * Retorna todos os adicionais associados a um produto específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do produto é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar adicionais associados ao produto
    const productAdicionais = await prisma.productAdicional.findMany({
      where: { productId: id },
      include: {
        adicional: true,
      },
    });

    // Extrair os adicionais (com merge de informações)
    const adicionais = productAdicionais.map((pa: any) => ({
      ...pa.adicional,
      productAdicionalId: pa.id,
      isRequired: pa.isRequired,
    }));

    return NextResponse.json({ success: true, data: adicionais });
  } catch (error) {
    console.error('Error fetching product adicionais:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar adicionais do produto' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products/[id]/adicionais
 * Associa um adicional a um produto
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { adicionalId, isRequired } = body;

    if (!id || !adicionalId) {
      return NextResponse.json(
        { success: false, error: 'ID do produto e adicional são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se produto e adicional existem
    const [product, adicional] = await Promise.all([
      prisma.product.findUnique({ where: { id } }),
      prisma.adicional.findUnique({ where: { id: adicionalId } }),
    ]);

    if (!product || !adicional) {
      return NextResponse.json(
        { success: false, error: 'Produto ou adicional não encontrado' },
        { status: 404 }
      );
    }

    // Criar associação
    const productAdicional = await prisma.productAdicional.create({
      data: {
        productId: id,
        adicionalId,
        isRequired: isRequired || false,
      },
      include: {
        adicional: true,
      },
    });

    return NextResponse.json({ success: true, data: productAdicional }, { status: 201 });
  } catch (error: any) {
    console.error('Error associating adicional to product:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Este adicional já está associado ao produto' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao associar adicional ao produto' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/[id]/adicionais
 * Remove a associação de um adicional do produto
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const adicionalId = searchParams.get('adicionalId');

    if (!id || !adicionalId) {
      return NextResponse.json(
        { success: false, error: 'ID do produto e adicional são obrigatórios' },
        { status: 400 }
      );
    }

    await prisma.productAdicional.delete({
      where: {
        // Usar unique constraint para identificar o registro
        productId_adicionalId: {
          productId: id,
          adicionalId,
        },
      },
    });

    return NextResponse.json({ success: true, message: 'Adicional removido do produto com sucesso' });
  } catch (error) {
    console.error('Error removing adicional from product:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao remover adicional do produto' },
      { status: 500 }
    );
  }
}
