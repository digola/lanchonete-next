// Configuração para integração gradual com dados reais
export interface RealDataConfig {
  // Controle global
  enableRealData: boolean;
  
  // Configurações por módulo
  modules: {
    products: {
      enabled: boolean;
      cacheTimeout: number;
      retryAttempts: number;
      fallbackToMock: boolean;
    };
    orders: {
      enabled: boolean;
      cacheTimeout: number;
      retryAttempts: number;
      fallbackToMock: boolean;
    };
    categories: {
      enabled: boolean;
      cacheTimeout: number;
      retryAttempts: number;
      fallbackToMock: boolean;
    };
    tables: {
      enabled: boolean;
      cacheTimeout: number;
      retryAttempts: number;
      fallbackToMock: boolean;
    };
    users: {
      enabled: boolean;
      cacheTimeout: number;
      retryAttempts: number;
      fallbackToMock: boolean;
    };
    admin: {
      enabled: boolean;
      cacheTimeout: number;
      retryAttempts: number;
      fallbackToMock: boolean;
    };
  };
  
  // Configurações de cache
  cache: {
    globalTimeout: number;
    maxSize: number;
    enableLogging: boolean;
  };
  
  // Configurações de fallback
  fallback: {
    enableMockData: boolean;
    showFallbackWarning: boolean;
    logFallbackUsage: boolean;
  };
}

// Configuração padrão - Dados simulados primeiro
export const defaultRealDataConfig: RealDataConfig = {
  enableRealData: false, // Começar com dados simulados
  
  modules: {
    products: {
      enabled: false,
      cacheTimeout: 600000, // 10 minutos
      retryAttempts: 2,
      fallbackToMock: true
    },
    orders: {
      enabled: false,
      cacheTimeout: 300000, // 5 minutos
      retryAttempts: 3,
      fallbackToMock: true
    },
    categories: {
      enabled: false,
      cacheTimeout: 1800000, // 30 minutos
      retryAttempts: 2,
      fallbackToMock: true
    },
    tables: {
      enabled: false,
      cacheTimeout: 300000, // 5 minutos
      retryAttempts: 2,
      fallbackToMock: true
    },
    users: {
      enabled: false,
      cacheTimeout: 600000, // 10 minutos
      retryAttempts: 2,
      fallbackToMock: true
    },
    admin: {
      enabled: false,
      cacheTimeout: 60000, // 1 minuto
      retryAttempts: 2,
      fallbackToMock: true
    }
  },
  
  cache: {
    globalTimeout: 300000, // 5 minutos
    maxSize: 100,
    enableLogging: true
  },
  
  fallback: {
    enableMockData: true,
    showFallbackWarning: true,
    logFallbackUsage: true
  }
};

// Configuração para desenvolvimento - Dados reais habilitados
export const developmentRealDataConfig: RealDataConfig = {
  enableRealData: true,
  
  modules: {
    products: {
      enabled: true,
      cacheTimeout: 300000, // 5 minutos
      retryAttempts: 2,
      fallbackToMock: true
    },
    orders: {
      enabled: true,
      cacheTimeout: 120000, // 2 minutos
      retryAttempts: 3,
      fallbackToMock: true
    },
    categories: {
      enabled: true,
      cacheTimeout: 600000, // 10 minutos
      retryAttempts: 2,
      fallbackToMock: true
    },
    tables: {
      enabled: true,
      cacheTimeout: 180000, // 3 minutos
      retryAttempts: 2,
      fallbackToMock: true
    },
    users: {
      enabled: true,
      cacheTimeout: 300000, // 5 minutos
      retryAttempts: 2,
      fallbackToMock: true
    },
    admin: {
      enabled: true,
      cacheTimeout: 30000, // 30 segundos
      retryAttempts: 2,
      fallbackToMock: true
    }
  },
  
  cache: {
    globalTimeout: 300000,
    maxSize: 200,
    enableLogging: true
  },
  
  fallback: {
    enableMockData: true,
    showFallbackWarning: true,
    logFallbackUsage: true
  }
};

// Configuração para produção - Dados reais obrigatórios
export const productionRealDataConfig: RealDataConfig = {
  enableRealData: true,
  
  modules: {
    products: {
      enabled: true,
      cacheTimeout: 600000, // 10 minutos
      retryAttempts: 3,
      fallbackToMock: false // Sem fallback em produção
    },
    orders: {
      enabled: true,
      cacheTimeout: 300000, // 5 minutos
      retryAttempts: 5,
      fallbackToMock: false
    },
    categories: {
      enabled: true,
      cacheTimeout: 1800000, // 30 minutos
      retryAttempts: 3,
      fallbackToMock: false
    },
    tables: {
      enabled: true,
      cacheTimeout: 300000, // 5 minutos
      retryAttempts: 3,
      fallbackToMock: false
    },
    users: {
      enabled: true,
      cacheTimeout: 600000, // 10 minutos
      retryAttempts: 3,
      fallbackToMock: false
    },
    admin: {
      enabled: true,
      cacheTimeout: 60000, // 1 minuto
      retryAttempts: 3,
      fallbackToMock: false
    }
  },
  
  cache: {
    globalTimeout: 300000,
    maxSize: 500,
    enableLogging: false
  },
  
  fallback: {
    enableMockData: false,
    showFallbackWarning: false,
    logFallbackUsage: false
  }
};

// Função para obter configuração baseada no ambiente
export function getRealDataConfig(): RealDataConfig {
  const env = process.env.NODE_ENV;
  
  switch (env) {
    case 'development':
      return developmentRealDataConfig;
    case 'production':
      return productionRealDataConfig;
    default:
      return defaultRealDataConfig;
  }
}

// Função para habilitar gradualmente módulos
export function enableModule(moduleName: keyof RealDataConfig['modules']): RealDataConfig {
  const config = getRealDataConfig();
  
  if (config.modules[moduleName]) {
    config.modules[moduleName].enabled = true;
    console.log(`✅ Módulo ${moduleName} habilitado para dados reais`);
  }
  
  return config;
}

// Função para desabilitar módulo
export function disableModule(moduleName: keyof RealDataConfig['modules']): RealDataConfig {
  const config = getRealDataConfig();
  
  if (config.modules[moduleName]) {
    config.modules[moduleName].enabled = false;
    console.log(`❌ Módulo ${moduleName} desabilitado - usando dados simulados`);
  }
  
  return config;
}

// Função para verificar se módulo está habilitado
export function isModuleEnabled(moduleName: keyof RealDataConfig['modules']): boolean {
  const config = getRealDataConfig();
  return config.enableRealData && config.modules[moduleName].enabled;
}

// Função para obter configuração de módulo específico
export function getModuleConfig(moduleName: keyof RealDataConfig['modules']) {
  const config = getRealDataConfig();
  return config.modules[moduleName];
}
