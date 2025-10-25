import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Retornar configurações padrão sem acessar o banco
    // Evita erro de conexão com Prisma durante desenvolvimento
    const publicSettings = {
      restaurantName: 'Lanchonete Next',
      restaurantDescription: 'Deliciosos lanches e refeições',
      deliveryEnabled: true,
      deliveryFee: 5.00,
      minOrderValue: 15.00,
      estimatedDeliveryTime: 30,
      workingHours: {
        monday: { open: '08:00', close: '22:00', closed: false },
        tuesday: { open: '08:00', close: '22:00', closed: false },
        wednesday: { open: '08:00', close: '22:00', closed: false },
        thursday: { open: '08:00', close: '22:00', closed: false },
        friday: { open: '08:00', close: '23:00', closed: false },
        saturday: { open: '09:00', close: '23:00', closed: false },
        sunday: { open: '09:00', close: '21:00', closed: false }
      },
      paymentMethods: ['DINHEIRO', 'CARTAO', 'PIX'],
      contactInfo: {
        phone: '(11) 99999-9999',
        email: 'contato@lanchonete.com',
        address: 'Rua das Delícias, 123 - Centro'
      }
    };

    return NextResponse.json({
      success: true,
      data: publicSettings
    });

  } catch (error) {
    console.error('Erro ao buscar configurações públicas:', error);
    
    // Retornar configurações mínimas em caso de erro
    return NextResponse.json({
      success: true,
      data: {
        restaurantName: 'Lanchonete Next',
        deliveryEnabled: true,
        deliveryFee: 5.00,
        minOrderValue: 15.00
      }
    });
  }
}
