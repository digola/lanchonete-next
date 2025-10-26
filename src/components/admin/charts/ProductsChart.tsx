'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface ProductData {
  name: string;
  quantity: number;
  revenue: number;
}

interface ProductsChartProps {
  data: ProductData[];
  title?: string;
  height?: number;
  maxItems?: number;
}

export function ProductsChart({ 
  data, 
  title = "Produtos Mais Vendidos", 
  height = 300,
  maxItems = 10 
}: ProductsChartProps) {
  // Limitar número de itens e formatar dados
  const chartData = data
    .slice(0, maxItems)
    .map((item, index) => ({
      ...item,
      quantity: item.quantity,
      revenue: item.revenue,
      nameShort: item.name.length > 15 ? `${item.name.substring(0, 15)}...` : item.name,
      rank: index + 1
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-xs">
          <p className="font-medium text-gray-900 mb-2">{data.name}</p>
          <p className="text-sm text-blue-600">
            Quantidade: {data.quantity}
          </p>
          <p className="text-sm text-green-600">
            Receita: {formatCurrency(data.revenue)}
          </p>
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
          <p className="text-sm text-gray-400">Não há dados de produtos para o período selecionado</p>
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
          layout="horizontal"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            type="number"
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            type="category"
            dataKey="nameShort" 
            stroke="#6b7280"
            fontSize={12}
            width={120}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="quantity" 
            fill="#f59e0b" 
            radius={[0, 2, 2, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      
      {/* Lista de produtos com ranking */}
      <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                {item.rank}
              </div>
              <span className="text-sm font-medium text-gray-900 truncate max-w-32">
                {item.name}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{item.quantity}</p>
              <p className="text-xs text-gray-500">{formatCurrency(item.revenue)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
