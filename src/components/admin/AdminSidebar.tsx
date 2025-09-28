'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard,
  Package,
  Folder,
  Users,
  ShoppingBag,
  Table,
  BarChart3,
  Settings,
  Shield,
  TrendingUp,
  Activity,
  User,
  HelpCircle,
  Database
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Produtos',
    href: '/admin/products',
    icon: Package,
  },
  {
    name: 'Categorias',
    href: '/admin/categories',
    icon: Folder,
  },
  {
    name: 'Usuários',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'Pedidos',
    href: '/admin/orders',
    icon: ShoppingBag,
  },
  {
    name: 'Mesas',
    href: '/admin/tables',
    icon: Table,
  },
];

const reportsItems = [
  {
    name: 'Relatórios',
    href: '/admin/relatorio',
    icon: BarChart3,
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: TrendingUp,
  },
  {
    name: 'Atividades',
    href: '/admin/activities',
    icon: Activity,
  },
];

const systemItems = [
  {
    name: 'Configurações',
    href: '/admin/settings',
    icon: Settings,
  },
  {
    name: 'Meu Perfil',
    href: '/admin/profile',
    icon: User,
  },
  {
    name: 'Backup',
    href: '/admin/backup',
    icon: Database,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="p-6">
        {/* Navegação Principal */}
        <nav className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Administração
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

        {/* Relatórios e Analytics */}
        <div className="mt-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Relatórios
          </h3>
          <nav className="space-y-1">
            {reportsItems.map((item) => {
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
        </div>

        {/* Sistema */}
        <div className="mt-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Sistema
          </h3>
          <nav className="space-y-1">
            {systemItems.map((item) => {
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
        </div>

        {/* Links Úteis */}
        <div className="mt-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Ajuda
          </h3>
          <nav className="space-y-1">
            <Link
              href="/admin/help"
              className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <HelpCircle className="h-5 w-5 mr-3" />
              Central de Ajuda
            </Link>
            <Link
              href="/admin/logs"
              className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <Database className="h-5 w-5 mr-3" />
              Logs do Sistema
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
