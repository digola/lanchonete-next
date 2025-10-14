'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface TableData {
  number: number;
  orders: number;
  revenue: number;
  capacity: number;
}

interface TablesChartProps {
  data: TableData[];
  title?: string;
  height?: number;
  maxItems?: number;
}

export function TablesChart({ 
  data, 
  title = "Ocupação das Mesas", 
  height = 300,
  maxItems = 8 
}: TablesChartProps) {
  // Dados para o gráfico de pizza (ocupação)
  const pieData = [
    { name: 'Mesas Ocupadas', value: data.filter(table => table.orders > 0).length, color: '#ef4444' },
    { name: 'Mesas Livres', value: data.filter(table => table.orders === 0).length, color: '#10b981' }
  ];

  // Dados para o gráfico de barras (top mesas)
  const topTablesData = data
    .sort((a, b) => b.orders - a.orders)
    .slice(0, maxItems)
    .map((table, index) => ({
      ...table,
      name: `Mesa ${table.number}`,
      rank: index + 1
    }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{data.name}</p>
          <p className="text-sm text-blue-600">
            Pedidos: {data.value}
          </p>
          <p className="text-sm text-green-600">
            Receita: R$ {data.revenue?.toLocaleString('pt-BR') || '0,00'}
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
          <p className="text-sm text-gray-400">Não há dados de mesas para o período selecionado</p>
        </div>
      </div>
    );
  }

  const totalOrders = data.reduce((sum, table) => sum + table.orders, 0);
  const occupiedTables = data.filter(table => table.orders > 0).length;
  const occupancyRate = data.length > 0 ? (occupiedTables / data.length) * 100 : 0;

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      {/* Gráfico de Pizza - Ocupação */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Status das Mesas</h4>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Taxa de Ocupação</p>
          <p className="text-xl font-bold text-blue-900">
            {occupancyRate.toFixed(1)}%
          </p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-sm text-green-600 font-medium">Total de Pedidos</p>
          <p className="text-xl font-bold text-green-900">
            {totalOrders}
          </p>
        </div>
      </div>

      {/* Top Mesas */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Mesas Mais Utilizadas</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {topTablesData.map((table, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  {table.rank}
                </div>
                <span className="text-sm font-medium text-gray-900">
                  Mesa {table.number}
                </span>
                <span className="text-xs text-gray-500">
                  ({table.capacity} lugares)
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{table.orders} pedidos</p>
                <p className="text-xs text-gray-500">
                  R$ {table.revenue.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
