import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/adicionais
 * Retorna todos os adicionais disponíveis com filtro opcional
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isAvailable = searchParams.get('isAvailable') === 'true';

    const where = isAvailable ? { isAvailable: true } : {};
    const adicionais = await prisma.adicional.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: adicionais });
  } catch (error) {
    console.error('Error fetching adicionais:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar adicionais' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/adicionais
 * Cria um novo adicional
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, maxQuantity } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    const adicional = await prisma.adicional.create({
      data: {
        name,
        description,
        price: price || 0,
        maxQuantity: maxQuantity || 1,
        isAvailable: true,
      },
    });

    return NextResponse.json({ success: true, data: adicional }, { status: 201 });
  } catch (error) {
    console.error('Error creating adicional:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar adicional' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/adicionais
 * Atualiza um adicional
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, price, maxQuantity, isAvailable } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    const adicional = await prisma.adicional.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(maxQuantity !== undefined && { maxQuantity }),
        ...(isAvailable !== undefined && { isAvailable }),
      },
    });

    return NextResponse.json({ success: true, data: adicional });
  } catch (error) {
    console.error('Error updating adicional:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar adicional' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/adicionais
 * Deleta um adicional
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    await prisma.adicional.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Adicional deletado com sucesso' });
  } catch (error) {
    console.error('Error deleting adicional:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar adicional' },
      { status: 500 }
    );
  }
}
