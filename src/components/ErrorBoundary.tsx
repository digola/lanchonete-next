'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <span className="mr-2">⚠️</span>
              Erro no Componente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-red-700">
                Ocorreu um erro inesperado. Tente recarregar a página ou entre em contato com o suporte.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-red-600">
                    Detalhes do Erro (Desenvolvimento)
                  </summary>
                  <div className="mt-2 p-3 bg-red-100 rounded text-xs font-mono text-red-800 overflow-auto">
                    <div><strong>Erro:</strong> {this.state.error.message}</div>
                    <div className="mt-2"><strong>Stack:</strong></div>
                    <pre className="mt-1 whitespace-pre-wrap">{this.state.error.stack}</pre>
                    {this.state.errorInfo && (
                      <>
                        <div className="mt-2"><strong>Component Stack:</strong></div>
                        <pre className="mt-1 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                      </>
                    )}
                  </div>
                </details>
              )}
              
              <div className="flex space-x-2">
                <Button onClick={this.handleRetry} variant="outline" size="sm">
                  Tentar Novamente
                </Button>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Recarregar Página
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook para error handling em componentes funcionais
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    console.error('Error caught by useErrorHandler:', error);
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      // Log do erro
      console.error('Error in component:', error);
    }
  }, [error]);

  return { error, handleError, resetError };
}

// Componente para exibir erros de API
interface ApiErrorProps {
  error: string | Error;
  onRetry?: () => void;
  fallbackMessage?: string;
}

export function ApiError({ error, onRetry, fallbackMessage }: ApiErrorProps) {
  const errorMessage = error instanceof Error ? error.message : error;
  
  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardContent className="p-4">
        <div className="flex items-center space-x-2">
          <span className="text-yellow-600">⚠️</span>
          <div className="flex-1">
            <p className="text-yellow-800 font-medium">
              {fallbackMessage || 'Erro ao carregar dados'}
            </p>
            <p className="text-yellow-700 text-sm mt-1">
              {errorMessage}
            </p>
          </div>
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="text-yellow-600 border-yellow-300 hover:bg-yellow-100"
            >
              Tentar Novamente
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para erros de rede
interface NetworkErrorProps {
  onRetry?: () => void;
  isOnline?: boolean;
}

export function NetworkError({ onRetry, isOnline = navigator.onLine }: NetworkErrorProps) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-4">
        <div className="flex items-center space-x-2">
          <span className="text-red-600">🌐</span>
          <div className="flex-1">
            <p className="text-red-800 font-medium">
              {isOnline ? 'Erro de Conexão' : 'Sem Conexão com a Internet'}
            </p>
            <p className="text-red-700 text-sm mt-1">
              {isOnline 
                ? 'Não foi possível conectar ao servidor. Verifique sua conexão.'
                : 'Verifique sua conexão com a internet e tente novamente.'
              }
            </p>
          </div>
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-100"
            >
              Tentar Novamente
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para erros de autenticação
interface AuthErrorProps {
  onLogin?: () => void;
  message?: string;
}

export function AuthError({ onLogin, message }: AuthErrorProps) {
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex items-center space-x-2">
          <span className="text-orange-600">🔒</span>
          <div className="flex-1">
            <p className="text-orange-800 font-medium">
              {message || 'Sessão Expirada'}
            </p>
            <p className="text-orange-700 text-sm mt-1">
              Sua sessão expirou. Faça login novamente para continuar.
            </p>
          </div>
          {onLogin && (
            <Button
              onClick={onLogin}
              variant="outline"
              size="sm"
              className="text-orange-600 border-orange-300 hover:bg-orange-100"
            >
              Fazer Login
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para erros de permissão
interface PermissionErrorProps {
  requiredRole?: string;
  onContactAdmin?: () => void;
}

export function PermissionError({ requiredRole, onContactAdmin }: PermissionErrorProps) {
  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardContent className="p-4">
        <div className="flex items-center space-x-2">
          <span className="text-purple-600">🚫</span>
          <div className="flex-1">
            <p className="text-purple-800 font-medium">
              Acesso Negado
            </p>
            <p className="text-purple-700 text-sm mt-1">
              {requiredRole 
                ? `Você precisa ter permissão de ${requiredRole} para acessar esta funcionalidade.`
                : 'Você não tem permissão para acessar esta funcionalidade.'
              }
            </p>
          </div>
          {onContactAdmin && (
            <Button
              onClick={onContactAdmin}
              variant="outline"
              size="sm"
              className="text-purple-600 border-purple-300 hover:bg-purple-100"
            >
              Contatar Admin
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para erros de validação
interface ValidationErrorProps {
  errors: string[];
  onClear?: () => void;
}

export function ValidationError({ errors, onClear }: ValidationErrorProps) {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center space-x-2">
          <span className="text-blue-600">📝</span>
          <div className="flex-1">
            <p className="text-blue-800 font-medium">
              Erros de Validação
            </p>
            <ul className="text-blue-700 text-sm mt-1 list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
          {onClear && (
            <Button
              onClick={onClear}
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              Limpar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Hook para detectar erros de rede
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Hook para error boundary em componentes funcionais
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}

export default ErrorBoundary;
