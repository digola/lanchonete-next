import React from 'react';

interface ModernCardProps {
  children: React.ReactNode;
  gradient?: 'none' | 'green' | 'blue' | 'purple' | 'orange' | 'yellow' | 'red';
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

const gradients = {
  none: 'bg-white',
  green: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200',
  blue: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200',
  purple: 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200',
  orange: 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200',
  yellow: 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200',
  red: 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200',
};

export function ModernCard({
  children,
  gradient = 'none',
  hover = false,
  className = '',
  onClick,
}: ModernCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        ${gradients[gradient]}
        border-2 rounded-2xl shadow-lg
        ${hover ? 'hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

