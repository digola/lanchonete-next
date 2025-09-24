'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard,
  ShoppingBag,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Settings,
  HelpCircle
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/customer/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Meus Pedidos',
    href: '/customer/orders',
    icon: ShoppingBag,
  },
  {
    name: 'Meu Perfil',
    href: '/customer/profile',
    icon: User,
  },
];

const orderStatusItems = [
  {
    name: 'Pendentes',
    href: '/customer/orders?status=pending',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  {
    name: 'Confirmados',
    href: '/customer/orders?status=confirmed',
    icon: CheckCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    name: 'Entregues',
    href: '/customer/orders?status=delivered',
    icon: Star,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    name: 'Cancelados',
    href: '/customer/orders?status=cancelled',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
];

export function CustomerSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="p-6">
        {/* Navegação Principal */}
        <nav className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Menu
          </h3>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Status dos Pedidos */}
        <div className="mt-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Status dos Pedidos
          </h3>
          <nav className="space-y-1">
            {orderStatusItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <div className={cn('p-1 rounded mr-3', item.bgColor)}>
                  <item.icon className={cn('h-4 w-4', item.color)} />
                </div>
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Links Úteis */}
        <div className="mt-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Ajuda
          </h3>
          <nav className="space-y-1">
            <Link
              href="/customer/help"
              className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <HelpCircle className="h-5 w-5 mr-3" />
              Central de Ajuda
            </Link>
            <Link
              href="/customer/settings"
              className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <Settings className="h-5 w-5 mr-3" />
              Configurações
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
