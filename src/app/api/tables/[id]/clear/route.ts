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
    if (decoded.role !== UserRole.MANAGER) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Buscar a mesa
    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        orders: {
          where: {
            status: {
              in: ['CONFIRMADO', 'PREPARANDO', 'ENTREGUE', 'FINALIZADO']
            }
          }
        }
      }
    });

    console.log('🔍 Mesa encontrada:', table);
    console.log('🔍 Pedidos da mesa:', table?.orders);

    if (!table) {
      return NextResponse.json({ error: 'Mesa não encontrada' }, { status: 404 });
    }

    // Verificar se há pedidos ativos na mesa (apenas pedidos não finalizados)
    const activeOrders = table.orders.filter(order => 
      order.status === 'CONFIRMADO' || order.status === 'PREPARANDO'
    );
    
    console.log('🔍 Pedidos ativos:', activeOrders);
    console.log('🔍 Total de pedidos na mesa:', table.orders.length);
    
    // Permitir limpeza apenas se não há pedidos em preparo
    if (activeOrders.length > 0) {
      console.log('❌ Não é possível limpar mesa com pedidos em preparo');
      return NextResponse.json(
        { error: 'Não é possível limpar a mesa. Há pedidos em preparo.' },
        { status: 400 }
      );
    }
    
    console.log('✅ Mesa pode ser limpa');

    // Limpar a mesa
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
