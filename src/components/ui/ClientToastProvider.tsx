'use client';

import { ToastProvider } from './Toast';

interface ClientToastProviderProps {
  children: React.ReactNode;
}

export function ClientToastProvider({ children }: ClientToastProviderProps) {
  return <ToastProvider>{children}</ToastProvider>;
}
