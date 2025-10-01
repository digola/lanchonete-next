import React from 'react';
import { Button } from './Button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  gradient?: 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'indigo';
  showBackButton?: boolean;
  backUrl?: string;
  actions?: React.ReactNode;
}

const gradients = {
  green: 'from-green-500 to-emerald-600',
  blue: 'from-blue-500 to-indigo-600',
  purple: 'from-purple-500 to-pink-600',
  orange: 'from-orange-500 to-red-600',
  red: 'from-red-500 to-rose-600',
  indigo: 'from-indigo-500 to-purple-600',
};

export function PageHeader({
  title,
  subtitle,
  icon,
  gradient = 'blue',
  showBackButton = false,
  backUrl,
  actions,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className={`bg-gradient-to-r ${gradients[gradient]} px-6 py-8 rounded-2xl shadow-xl mb-6`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {showBackButton && (
            <Button
              variant="ghost"
              onClick={() => backUrl ? router.push(backUrl) : router.back()}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          
          <div className="flex items-center space-x-3">
            {icon && <div className="text-white text-4xl">{icon}</div>}
            <div>
              <h1 className="text-3xl font-bold text-white">{title}</h1>
              {subtitle && <p className="text-white/90 mt-1">{subtitle}</p>}
            </div>
          </div>
        </div>

        {actions && <div className="flex items-center space-x-3">{actions}</div>}
      </div>
    </div>
  );
}

