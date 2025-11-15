import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
import { verifyToken } from '@/lib/auth';
import { UserRole } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verificar autenticação
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar permissões (apenas MANAGER)
    if (decoded.role !== UserRole.MANAGER && decoded.role !== UserRole.STAFF) {
      return NextResponse.json({ error: 'Acesso negado livrar mesa apenas na expedicão' }, { status: 403 });
    }

    // Buscar a mesa e pedidos relevantes
    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        orders: {
          where: {
            status: { in: ['CONFIRMADO', 'PREPARANDO', 'PRONTO', 'ENTREGUE', 'FINALIZADO'] }
          },
          select: { id: true, status: true, isPaid: true, total: true }
        }
      }
    });

    console.log('🔍 Mesa encontrada:', table);
    console.log('🔍 Pedidos da mesa:', table?.orders);

    if (!table) {
      return NextResponse.json({ error: 'Mesa não encontrada' }, { status: 404 });
    }

    // Regras de liberação:
    // 1) Não pode haver pedidos com status em preparo/ativos
    const activeStatuses = ['CONFIRMADO', 'PREPARANDO', 'PRONTO'];
    const hasActive = table.orders.some(o => activeStatuses.includes(String(o.status).toUpperCase()));

    // 2) Não pode haver pedido ENTREGUE sem pagamento
    const hasDeliveredUnpaid = table.orders.some(o => String(o.status).toUpperCase() === 'ENTREGUE' && !o.isPaid);

    if (hasActive || hasDeliveredUnpaid) {
      const reason = hasActive
        ? 'Há pedidos em preparo/ativos na mesa.'
        : 'Há pedido ENTREGUE ainda não pago.';
      return NextResponse.json(
        { error: `Não é possível limpar a mesa. ${reason}` },
        { status: 400 }
      );
    }
    
    console.log('✅ Mesa pode ser limpa');

    // Limpar a mesa somente via botão
    console.log('🧹 Limpando mesa...');
    console.log('🔍 Dados de atualização:', { status: 'LIVRE', assignedTo: null });
    
    const updatedTable = await prisma.table.update({
      where: { id },
      data: {
        status: 'LIVRE',
        assignedTo: null
      }
    });

    console.log('✅ Mesa atualizada:', updatedTable);
    console.log('✅ Status da mesa:', updatedTable.status);

    return NextResponse.json({
      success: true,
      table: updatedTable,
      message: 'Mesa limpa com sucesso'
    });

  } catch (error) {
    console.error('Erro ao limpar mesa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
