'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  title?: string;
  height?: number;
}

export function RevenueChart({ data, title = "Evolução da Receita", height = 300 }: RevenueChartProps) {
  // Formatar dados para o gráfico
  const chartData = data.map(item => ({
    ...item,
    revenue: item.revenue,
    orders: item.orders,
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
              {entry.dataKey === 'revenue' ? 'Receita' : 'Pedidos'}: {
                entry.dataKey === 'revenue' 
                  ? formatCurrency(entry.value) 
                  : entry.value
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
          <p className="text-sm text-gray-400">Não há dados de receita para o período selecionado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
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
            tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="#10b981" 
            strokeWidth={3}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
            name="Receita"
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Estatísticas rápidas */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-sm text-green-600 font-medium">Receita Total</p>
          <p className="text-xl font-bold text-green-900">
            {formatCurrency(data.reduce((sum, item) => sum + item.revenue, 0))}
          </p>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Total de Pedidos</p>
          <p className="text-xl font-bold text-blue-900">
            {data.reduce((sum, item) => sum + item.orders, 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
