'use client';

import { ReactNode } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { UserRole } from '@/types';
import { StaffSidebar } from '@/components/staff/StaffSidebar';
import { StaffHeader } from '@/components/staff/StaffHeader';

interface StaffLayoutProps {
  children: ReactNode;
}

export default function StaffLayout({ children }: StaffLayoutProps) {
  return (
    <ProtectedRoute requiredRole={UserRole.FUNCIONARIO}>
      <div className="min-h-screen bg-gray-50">
        <StaffHeader />
        <div className="flex">
          <StaffSidebar />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
