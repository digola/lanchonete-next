'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { OrderStatus } from '@/types';

interface OrdersData {
  date: string;
  orders: number;
  revenue: number;
}

interface OrdersChartProps {
  data: OrdersData[];
  title?: string;
  height?: number;
}

export function OrdersChart({ data, title = "Pedidos por Período", height = 300 }: OrdersChartProps) {
  // Formatar dados para o gráfico
  const chartData = data.map(item => ({
    ...item,
    orders: item.orders,
    revenue: item.revenue,
    dateFormatted: new Date(item.date).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    })
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{`Data: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'orders' ? 'Pedidos' : 'Receita'}: {
                entry.dataKey === 'orders' 
                  ? entry.value
                  : `R$ ${entry.value.toLocaleString('pt-BR')}`
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-gray-500 mb-2">Nenhum dado disponível</p>
          <p className="text-sm text-gray-400">Não há dados de pedidos para o período selecionado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="dateFormatted" 
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="orders" 
            fill="#3b82f6" 
            name="Pedidos"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      
      {/* Estatísticas rápidas */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Total de Pedidos</p>
          <p className="text-xl font-bold text-blue-900">
            {data.reduce((sum, item) => sum + item.orders, 0)}
          </p>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <p className="text-sm text-purple-600 font-medium">Ticket Médio</p>
          <p className="text-xl font-bold text-purple-900">
            R$ {data.length > 0 ? (data.reduce((sum, item) => sum + item.revenue, 0) / data.reduce((sum, item) => sum + item.orders, 0)).toFixed(2) : '0,00'}
          </p>
        </div>
      </div>
    </div>
  );
}
