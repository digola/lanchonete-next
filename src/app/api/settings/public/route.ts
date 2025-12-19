import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const publicSettings = {
      restaurantName: 'Lanchonete',
      restaurantAddress: 'Endereço não informado',
      restaurantPhone: '(11) 99999-9999',
      restaurantEmail: 'contato@lanchonete.com',
      openingTime: '08:00',
      closingTime: '22:00',
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      currency: 'BRL',
      language: 'pt-BR',
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
