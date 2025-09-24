'use client';

import { ReactNode } from 'react';
import { useApiAuth } from '@/hooks/useApiAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { UserRole } from '@/types';
import { CustomerSidebar } from '@/components/customer/CustomerSidebar';
import { CustomerHeader } from '@/components/customer/CustomerHeader';

interface CustomerLayoutProps {
  children: ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  return (
    <ProtectedRoute requiredRole={UserRole.CLIENTE}>
      <div className="min-h-screen bg-gray-50">
        <CustomerHeader />
        <div className="flex">
          <CustomerSidebar />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
