'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getRealDataConfig, enableModule, disableModule, isModuleEnabled } from '@/config/realDataConfig';

interface RealDataManagerProps {
  onConfigChange?: (config: any) => void;
}

export default function RealDataManager({ onConfigChange }: RealDataManagerProps) {
  const [config, setConfig] = useState(getRealDataConfig());
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleModule = (moduleName: keyof typeof config.modules) => {
    const newConfig = isModuleEnabled(moduleName) 
      ? disableModule(moduleName)
      : enableModule(moduleName);
    
    setConfig(newConfig);
    onConfigChange?.(newConfig);
    
    // Salvar no localStorage para persistir entre sessões
    localStorage.setItem('realDataConfig', JSON.stringify(newConfig));
  };

  const resetToDefault = () => {
    const defaultConfig = getRealDataConfig();
    setConfig(defaultConfig);
    onConfigChange?.(defaultConfig);
    localStorage.setItem('realDataConfig', JSON.stringify(defaultConfig));
  };

  const enableAllModules = () => {
    const newConfig = { ...config };
    Object.keys(newConfig.modules).forEach(module => {
      newConfig.modules[module as keyof typeof newConfig.modules].enabled = true;
    });
    setConfig(newConfig);
    onConfigChange?.(newConfig);
    localStorage.setItem('realDataConfig', JSON.stringify(newConfig));
  };

  const disableAllModules = () => {
    const newConfig = { ...config };
    Object.keys(newConfig.modules).forEach(module => {
      newConfig.modules[module as keyof typeof newConfig.modules].enabled = false;
    });
    setConfig(newConfig);
    onConfigChange?.(newConfig);
    localStorage.setItem('realDataConfig', JSON.stringify(newConfig));
  };

  useEffect(() => {
    // Carregar configuração salva
    const savedConfig = localStorage.getItem('realDataConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
        onConfigChange?.(parsedConfig);
      } catch (error) {
        console.error('Erro ao carregar configuração salva:', error);
      }
    }
  }, [onConfigChange]);

  const moduleNames = {
    products: 'Produtos',
    orders: 'Pedidos',
    categories: 'Categorias',
    tables: 'Mesas',
    users: 'Usuários',
    admin: 'Administração'
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <span>🔧</span>
            <span>Gerenciador de Dados Reais</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Recolher' : 'Expandir'}
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          Configure quais módulos devem usar dados reais do banco de dados
        </p>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Status Geral */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Status Geral</h3>
              <p className="text-sm text-gray-600">
                {config.enableRealData ? 'Dados reais habilitados' : 'Dados simulados'}
              </p>
            </div>
            <Badge variant={config.enableRealData ? 'success' : 'secondary'}>
              {config.enableRealData ? 'Ativo' : 'Simulado'}
            </Badge>
          </div>

          {/* Controles Gerais */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={enableAllModules}
              className="text-green-600 border-green-300 hover:bg-green-50"
            >
              Habilitar Todos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={disableAllModules}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Desabilitar Todos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefault}
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              Resetar
            </Button>
          </div>

          {/* Módulos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(moduleNames).map(([moduleKey, moduleName]) => {
              const moduleConfig = config.modules[moduleKey as keyof typeof config.modules];
              const isEnabled = isModuleEnabled(moduleKey as keyof typeof config.modules);
              
              return (
                <Card key={moduleKey} className={`border-2 ${isEnabled ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{moduleName}</h4>
                      <Badge variant={isEnabled ? 'success' : 'secondary'}>
                        {isEnabled ? 'Real' : 'Simulado'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Cache:</span>
                        <span>{Math.round(moduleConfig.cacheTimeout / 1000)}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tentativas:</span>
                        <span>{moduleConfig.retryAttempts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fallback:</span>
                        <span>{moduleConfig.fallbackToMock ? 'Sim' : 'Não'}</span>
                      </div>
                    </div>
                    
                    <Button
                      variant={isEnabled ? 'destructive' : 'primary'}
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => toggleModule(moduleKey as keyof typeof config.modules)}
                    >
                      {isEnabled ? 'Desabilitar' : 'Habilitar'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Informações de Cache */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Informações de Cache</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <span className="font-medium">Timeout Global:</span> {Math.round(config.cache.globalTimeout / 1000)}s
              </div>
              <div>
                <span className="font-medium">Tamanho Máximo:</span> {config.cache.maxSize} itens
              </div>
              <div>
                <span className="font-medium">Logs:</span> {config.cache.enableLogging ? 'Ativo' : 'Inativo'}
              </div>
              <div>
                <span className="font-medium">Fallback:</span> {config.fallback.enableMockData ? 'Ativo' : 'Inativo'}
              </div>
            </div>
          </div>

          {/* Avisos */}
          <div className="space-y-2">
            {!config.enableRealData && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center">
                  <span className="text-yellow-600 mr-2">⚠️</span>
                  <span className="text-sm text-yellow-800">
                    <strong>Atenção:</strong> Dados reais estão desabilitados globalmente
                  </span>
                </div>
              </div>
            )}
            
            {config.fallback.enableMockData && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center">
                  <span className="text-blue-600 mr-2">ℹ️</span>
                  <span className="text-sm text-blue-800">
                    <strong>Fallback ativo:</strong> Dados simulados serão usados em caso de erro
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
