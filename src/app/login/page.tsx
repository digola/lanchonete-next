'use client';

import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApiAuth } from '@/hooks/useApiAuth';
import { GuestRoute } from '@/components/ProtectedRoute';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError, isAuthenticated, getDefaultRoute } = useApiAuth();
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = getDefaultRoute();
      router.push(redirectTo);
    }
  }, [isAuthenticated, router, getDefaultRoute]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Limpar erro quando usuário começar a digitar
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      return;
    }

    const result = await login(formData);
    
    if (result.success) {
      const redirectTo = getDefaultRoute();
      router.push(redirectTo);
    }
  };

  return (
    <GuestRoute>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">🍔</span>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Entre na sua conta
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Ou{' '}
              <Link
                href="/register"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                crie uma nova conta
              </Link>
            </p>
          </div>

          {/* Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="form-label">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="input pr-10"
                    placeholder="Sua senha"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878L12 12m-2.122-2.122l1.414 1.414M12 12l1.414 1.414m-2.828-2.828l4.242 4.242M12 12l-1.414-1.414M12 12l-1.414 1.414" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading || !formData.email || !formData.password}
                className="btn btn-primary btn-lg w-full"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner mr-2"></div>
                    Entrando...
                  </div>
                ) : (
                  'Entrar'
                )}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                Esqueceu sua senha?
              </Link>
            </div>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 bg-gray-100 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Credenciais de demonstração:
            </h3>
            <div className="text-xs text-gray-600 space-y-1">
              <div><strong>Admin:</strong> admin@lanchonete.com / 123456</div>
              <div><strong>Funcionário:</strong> funcionario@lanchonete.com / 123456</div>
              <div><strong>Cliente:</strong> cliente@lanchonete.com / 123456</div>
            </div>
          </div>
        </div>
      </div>
    </GuestRoute>
  );
}
