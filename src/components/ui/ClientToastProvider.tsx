'use client';

import { useState, useEffect } from 'react';
import { ToastProvider } from './Toast';

interface ClientToastProviderProps {
  children: React.ReactNode;
}

export function ClientToastProvider({ children }: ClientToastProviderProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <>{children}</>;
  }

  return <ToastProvider>{children}</ToastProvider>;
}
