'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Building2,
  CreditCard,
  Printer,
  Database,
  Clock,
  Phone,
  Mail,
  MapPin,
  Globe,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { 
  GeneralSettings, 
  PaymentSettings, 
  PrintingSettings, 
  BackupSettings 
} from '@/types';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'payment' | 'printing' | 'backup'>('general');
  
  // Estados das configurações
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    restaurantName: '',
    restaurantAddress: '',
    restaurantPhone: '',
    restaurantEmail: '',
    openingTime: '08:00',
    closingTime: '22:00',
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    timezone: 'America/Sao_Paulo',
    currency: 'BRL',
    language: 'pt-BR',
  });

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    acceptedMethods: ['cash', 'pix'],
    pixKey: '',
    pixEnabled: true,
    cashEnabled: true,
    creditCardEnabled: false,
    debitCardEnabled: false,
    digitalWalletEnabled: false,
    taxRate: 0,
    minimumOrderValue: 0,
  });

  const [printingSettings, setPrintingSettings] = useState<PrintingSettings>({
    printerName: '',
    printerType: 'thermal',
    paperWidth: 80,
    fontSize: 12,
    printHeader: true,
    printFooter: true,
    printLogo: false,
    logoUrl: '',
    headerText: '',
    footerText: '',
    autoPrint: true,
    printOrders: true,
    printReceipts: true,
  });

  const [backupSettings, setBackupSettings] = useState<BackupSettings>({
    autoBackupEnabled: false,
    backupFrequency: 'daily',
    backupTime: '02:00',
    backupRetention: 30,
    cloudBackupEnabled: false,
    localBackupEnabled: true,
    backupLocation: '',
  });

  // Buscar dados do usuário
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.user) {
            setUser(data.data.user);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar usuário:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Buscar configurações
  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Carregar configurações por categoria
          if (data.data.general) {
            const general = data.data.general;
            setGeneralSettings({
              restaurantName: general.restaurantName?.value ? JSON.parse(general.restaurantName.value) : '',
              restaurantAddress: general.restaurantAddress?.value ? JSON.parse(general.restaurantAddress.value) : '',
              restaurantPhone: general.restaurantPhone?.value ? JSON.parse(general.restaurantPhone.value) : '',
              restaurantEmail: general.restaurantEmail?.value ? JSON.parse(general.restaurantEmail.value) : '',
              openingTime: general.openingTime?.value ? JSON.parse(general.openingTime.value) : '08:00',
              closingTime: general.closingTime?.value ? JSON.parse(general.closingTime.value) : '22:00',
              workingDays: general.workingDays?.value ? JSON.parse(general.workingDays.value) : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
              timezone: general.timezone?.value ? JSON.parse(general.timezone.value) : 'America/Sao_Paulo',
              currency: general.currency?.value ? JSON.parse(general.currency.value) : 'BRL',
              language: general.language?.value ? JSON.parse(general.language.value) : 'pt-BR',
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      console.log('🔧 Iniciando salvamento no frontend...');
      const token = localStorage.getItem('auth-token');
      
      // Preparar configurações para envio
      const settingsToSave: Array<{key: string, value: any, category: string, description: string}> = [];
      
      if (activeTab === 'general') {
        console.log('📝 Preparando configurações gerais...');
        Object.entries(generalSettings).forEach(([key, value]) => {
          settingsToSave.push({
            key,
            value,
            category: 'general',
            description: `Configuração geral: ${key}`,
          });
        });
      } else if (activeTab === 'payment') {
        Object.entries(paymentSettings).forEach(([key, value]) => {
          settingsToSave.push({
            key,
            value,
            category: 'payment',
            description: `Configuração de pagamento: ${key}`,
          });
        });
      } else if (activeTab === 'printing') {
        Object.entries(printingSettings).forEach(([key, value]) => {
          settingsToSave.push({
            key,
            value,
            category: 'printing',
            description: `Configuração de impressão: ${key}`,
          });
        });
      } else if (activeTab === 'backup') {
        Object.entries(backupSettings).forEach(([key, value]) => {
          settingsToSave.push({
            key,
            value,
            category: 'backup',
            description: `Configuração de backup: ${key}`,
          });
        });
      }

      console.log('📦 Configurações preparadas:', settingsToSave);
      console.log('📤 Enviando para API...');

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ settings: settingsToSave }),
      });

      console.log('📥 Resposta recebida:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Sucesso:', data);
        alert('Configurações salvas com sucesso!');
      } else {
        const errorData = await response.json();
        console.error('❌ Erro na resposta:', errorData);
        alert(`Erro ao salvar configurações: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('💥 Erro ao salvar configurações:', error);
      alert(`Erro ao salvar configurações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  // Verificar se o usuário é admin
  const isAdmin = user && (
    !user.role ||
    user.role === 'ADMIN' || 
    user.role === 'ADMINISTRADOR' || 
    user.role === 'administrador' ||
    user.role === 'Administrador' ||
    user.role?.toLowerCase() === 'administrador' ||
    user.role?.toLowerCase().includes('admin')
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'Gerais', icon: Building2 },
    { id: 'payment', label: 'Pagamento', icon: CreditCard },
    { id: 'printing', label: 'Impressão', icon: Printer },
    { id: 'backup', label: 'Backup', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <SettingsIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Configurações do Sistema</h1>
                <p className="text-sm text-gray-600">Gerencie as configurações do restaurante</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={fetchSettings}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Atualizar</span>
              </Button>
              
              <Button
                onClick={saveSettings}
                disabled={saving}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
                <span>{saving ? 'Salvando...' : 'Salvar'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Conteúdo das Abas */}
        <div className="space-y-6">
          {activeTab === 'general' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Configurações Gerais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Restaurante
                    </label>
                    <Input
                      value={generalSettings.restaurantName}
                      onChange={(e) => setGeneralSettings({...generalSettings, restaurantName: e.target.value})}
                      placeholder="Nome do seu restaurante"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone
                    </label>
                    <Input
                      value={generalSettings.restaurantPhone}
                      onChange={(e) => setGeneralSettings({...generalSettings, restaurantPhone: e.target.value})}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={generalSettings.restaurantEmail}
                      onChange={(e) => setGeneralSettings({...generalSettings, restaurantEmail: e.target.value})}
                      placeholder="contato@restaurante.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Endereço
                    </label>
                    <Input
                      value={generalSettings.restaurantAddress}
                      onChange={(e) => setGeneralSettings({...generalSettings, restaurantAddress: e.target.value})}
                      placeholder="Rua, Número, Bairro, Cidade"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horário de Abertura
                    </label>
                    <Input
                      type="time"
                      value={generalSettings.openingTime}
                      onChange={(e) => setGeneralSettings({...generalSettings, openingTime: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horário de Fechamento
                    </label>
                    <Input
                      type="time"
                      value={generalSettings.closingTime}
                      onChange={(e) => setGeneralSettings({...generalSettings, closingTime: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Moeda
                    </label>
                    <select
                      value={generalSettings.currency}
                      onChange={(e) => setGeneralSettings({...generalSettings, currency: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="BRL">Real (BRL)</option>
                      <option value="USD">Dólar (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Idioma
                    </label>
                    <select
                      value={generalSettings.language}
                      onChange={(e) => setGeneralSettings({...generalSettings, language: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pt-BR">Português (Brasil)</option>
                      <option value="en-US">English (US)</option>
                      <option value="es-ES">Español</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dias de Funcionamento
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                      <label key={day} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={generalSettings.workingDays.includes(day)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setGeneralSettings({
                                ...generalSettings,
                                workingDays: [...generalSettings.workingDays, day]
                              });
                            } else {
                              setGeneralSettings({
                                ...generalSettings,
                                workingDays: generalSettings.workingDays.filter(d => d !== day)
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {day === 'monday' ? 'Seg' :
                           day === 'tuesday' ? 'Ter' :
                           day === 'wednesday' ? 'Qua' :
                           day === 'thursday' ? 'Qui' :
                           day === 'friday' ? 'Sex' :
                           day === 'saturday' ? 'Sáb' :
                           'Dom'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'payment' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Configurações de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Em desenvolvimento...</p>
              </CardContent>
            </Card>
          )}

          {activeTab === 'printing' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Printer className="h-5 w-5 mr-2" />
                  Configurações de Impressão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Em desenvolvimento...</p>
              </CardContent>
            </Card>
          )}

          {activeTab === 'backup' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Configurações de Backup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Em desenvolvimento...</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
