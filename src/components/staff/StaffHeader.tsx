'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApiAuth } from '@/hooks/useApiAuth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Menu, 
  Bell, 
  User,
  LogOut,
  Home,
  Users
} from 'lucide-react';

export function StaffHeader() {
  const { user, logout, getRoleLabel, getUserDisplayName } = useApiAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo e Navegação Principal */}
          <div className="flex items-center space-x-4">
            <Link href="/staff" prefetch={false} className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Lanchonete</span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                href="/staff" 
                prefetch={false}
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                href="/staff/tables" 
                prefetch={false}
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                Mesas
              </Link>
              <Link 
                href="/" 
                prefetch={false}
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                Cardápio
              </Link>
            </nav>
          </div>

          {/* Ações do Usuário */}
          <div className="flex items-center space-x-4">
            {/* Notificações */}
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>

            {/* Menu do Usuário */}
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2"
              >
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-600" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getRoleLabel()}
                  </p>
                </div>
              </Button>

              {/* Dropdown do Usuário */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <Link
                    href="/staff/tables"
                    prefetch={false}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Users className="h-4 w-4 mr-3" />
                    Mesas
                  </Link>
                  <Link
                    href="/"
                    prefetch={false}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Home className="h-4 w-4 mr-3" />
                    Cardápio
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
