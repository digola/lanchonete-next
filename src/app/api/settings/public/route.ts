import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Buscar apenas configurações gerais (públicas)
    // Ajustado para o modelo Prisma correto: SystemSettings
    const settings = await prisma.systemSettings.findMany({
      where: {
        category: 'GENERAL',
      },
      select: {
        key: true,
        value: true,
      },
    });

    // Converter para objeto mais fácil de usar
    const generalSettings = settings.reduce((acc, setting) => {
      try {
        acc[setting.key] = JSON.parse(setting.value);
      } catch {
        acc[setting.key] = setting.value;
      }
      return acc;
    }, {} as Record<string, any>);

    // Definir valores padrão
    const publicSettings = {
      restaurantName: generalSettings.restaurantName || 'Lanchonete',
      restaurantAddress: generalSettings.restaurantAddress || 'Endereço não informado',
      restaurantPhone: generalSettings.restaurantPhone || '(11) 99999-9999',
      restaurantEmail: generalSettings.restaurantEmail || 'contato@lanchonete.com',
      openingTime: generalSettings.openingTime || '08:00',
      closingTime: generalSettings.closingTime || '22:00',
      workingDays: generalSettings.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      currency: generalSettings.currency || 'BRL',
      language: generalSettings.language || 'pt-BR',
    };

    return NextResponse.json({
      success: true,
      data: publicSettings,
    });
  } catch (error) {
    console.error('Erro ao buscar configurações públicas:', error);
    
    // Retornar configurações padrão em caso de erro
    return NextResponse.json({
      success: true,
      data: {
        restaurantName: 'Lanchonete',
        restaurantAddress: 'Endereço não informado',
        restaurantPhone: '(11) 99999-9999',
        restaurantEmail: 'contato@lanchonete.com',
        openingTime: '08:00',
        closingTime: '22:00',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        currency: 'BRL',
        language: 'pt-BR',
      },
    });
  }
}
