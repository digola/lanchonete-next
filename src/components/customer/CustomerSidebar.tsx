'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  User,
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
    name: 'Cardápio',
    href: '/customer/cart',
    icon: ShoppingCart,
  },
  {
    name: 'Meu Perfil',
    href: '/customer/profile',
    icon: User,
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
