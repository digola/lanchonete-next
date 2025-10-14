import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'yellow';
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const colors = {
  green: {
    bg: 'from-green-500 to-emerald-600',
    icon: 'bg-green-100 text-green-600',
    text: 'text-green-600',
  },
  blue: {
    bg: 'from-blue-500 to-indigo-600',
    icon: 'bg-blue-100 text-blue-600',
    text: 'text-blue-600',
  },
  purple: {
    bg: 'from-purple-500 to-pink-600',
    icon: 'bg-purple-100 text-purple-600',
    text: 'text-purple-600',
  },
  orange: {
    bg: 'from-orange-500 to-red-600',
    icon: 'bg-orange-100 text-orange-600',
    text: 'text-orange-600',
  },
  red: {
    bg: 'from-red-500 to-rose-600',
    icon: 'bg-red-100 text-red-600',
    text: 'text-red-600',
  },
  yellow: {
    bg: 'from-yellow-500 to-amber-600',
    icon: 'bg-yellow-100 text-yellow-600',
    text: 'text-yellow-600',
  },
};

export function StatsCard({
  title,
  value,
  icon,
  color = 'blue',
  subtitle,
  trend,
}: StatsCardProps) {
  const colorScheme = colors[color];

  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${colorScheme.icon} flex items-center justify-center text-2xl`}>
          {icon}
        </div>
        {trend && (
          <span
            className={`text-sm font-semibold ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className={`text-3xl font-bold ${colorScheme.text}`}>{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

