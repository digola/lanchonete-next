import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'ADMINISTRADOR')) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const whereClause = category ? { category } : {};

    const settings = await prisma.settings.findMany({
      where: whereClause,
      orderBy: { category: 'asc' },
    });

    // Agrupar configurações por categoria
    const groupedSettings = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = {};
      }
      acc[setting.category]![setting.key] = setting;
      return acc;
    }, {} as Record<string, Record<string, any>>);

    return NextResponse.json({
      success: true,
      data: groupedSettings,
    });
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'ADMINISTRADOR')) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { key, value, category, description } = body;

    if (!key || !category) {
      return NextResponse.json(
        { error: 'Chave e categoria são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se a configuração já existe
    const existingSetting = await prisma.settings.findUnique({
      where: { key },
    });

    let setting;
    if (existingSetting) {
      // Atualizar configuração existente
      setting = await prisma.settings.update({
        where: { key },
        data: {
          value: JSON.stringify(value),
          description,
          updatedAt: new Date(),
        },
      });
    } else {
      // Criar nova configuração
      setting = await prisma.settings.create({
        data: {
          key,
          value: JSON.stringify(value),
          category,
          description,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: setting,
    });
  } catch (error) {
    console.error('Erro ao salvar configuração:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🔧 Iniciando salvamento de configurações...');
    
    const token = getTokenFromRequest(request);
    if (!token) {
      console.log('❌ Token não fornecido');
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const user = await verifyToken(token);
    console.log('👤 Usuário verificado:', user ? { id: user.userId, role: user.role } : 'Nenhum');
    
    if (!user || (user.role !== 'ADMIN' && user.role !== 'ADMINISTRADOR')) {
      console.log('❌ Acesso negado');
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    console.log('📦 Body recebido:', JSON.stringify(body, null, 2));
    
    const { settings } = body; // Array de configurações

    if (!Array.isArray(settings)) {
      console.log('❌ Settings não é um array:', typeof settings);
      return NextResponse.json(
        { error: 'Configurações devem ser um array' },
        { status: 400 }
      );
    }

    console.log(`📝 Processando ${settings.length} configurações...`);
    const results = [];

    for (const setting of settings) {
      console.log('⚙️ Processando configuração:', setting.key);
      const { key, value, category, description } = setting;

      try {
        const existingSetting = await prisma.settings.findUnique({
          where: { key },
        });

        let result;
        if (existingSetting) {
          console.log(`🔄 Atualizando configuração existente: ${key}`);
          result = await prisma.settings.update({
            where: { key },
            data: {
              value: JSON.stringify(value),
              description,
              updatedAt: new Date(),
            },
          });
        } else {
          console.log(`➕ Criando nova configuração: ${key}`);
          result = await prisma.settings.create({
            data: {
              key,
              value: JSON.stringify(value),
              category,
              description,
            },
          });
        }

        console.log('✅ Configuração salva:', { key, category });
        results.push(result);
      } catch (settingError) {
        console.error(`❌ Erro ao salvar configuração ${key}:`, settingError);
        throw settingError;
      }
    }

    console.log('🎉 Todas as configurações salvas com sucesso!');
    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('💥 Erro ao atualizar configurações:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
