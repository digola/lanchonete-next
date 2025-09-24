'use client';

import { useState } from 'react';
import { useApiAuth } from '@/hooks/useApiAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatDateTime } from '@/lib/utils';
import { 
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Edit,
  Save,
  X,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function CustomerProfilePage() {
  const { user, updateProfile, changePassword } = useApiAuth();
  
  // Estados do formulário de perfil
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estados do formulário de senha
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);

    try {
      const result = await updateProfile({
        name: profileForm.name,
      });

      if (result.success) {
        setProfileMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        setIsEditingProfile(false);
      } else {
        setProfileMessage({ type: 'error', text: result.error || 'Erro ao atualizar perfil' });
      }
    } catch (error) {
      setProfileMessage({ type: 'error', text: 'Erro ao atualizar perfil' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'As senhas não coincidem' });
      setPasswordLoading(false);
      return;
    }

    try {
      const result = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      if (result.success) {
        setPasswordMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setIsChangingPassword(false);
      } else {
        setPasswordMessage({ type: 'error', text: result.error || 'Erro ao alterar senha' });
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'Erro ao alterar senha' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Meu Perfil
        </h1>
        <p className="text-gray-600 mt-1">
          Gerencie suas informações pessoais
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações do Perfil */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Informações Pessoais
              </CardTitle>
              <Button
                variant={isEditingProfile ? 'ghost' : 'outline'}
                size="sm"
                onClick={() => {
                  setIsEditingProfile(!isEditingProfile);
                  setProfileMessage(null);
                  if (!isEditingProfile) {
                    setProfileForm({
                      name: user?.name || '',
                      email: user?.email || '',
                    });
                  }
                }}
              >
                {isEditingProfile ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {isEditingProfile ? (
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Completo
                      </label>
                      <Input
                        value={profileForm.name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={profileForm.email}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        O email não pode ser alterado
                      </p>
                    </div>
                  </div>

                  {profileMessage && (
                    <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                      profileMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {profileMessage.type === 'success' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <span className="text-sm">{profileMessage.text}</span>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsEditingProfile(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={profileLoading}
                    >
                      {profileLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Salvar
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary-100 rounded-lg">
                        <User className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Nome</p>
                        <p className="text-gray-900">{user?.name || 'Não informado'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Mail className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Email</p>
                        <p className="text-gray-900">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Cliente desde</p>
                      <p className="text-gray-900">
                        {user?.createdAt ? formatDateTime(user.createdAt) : 'Não informado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Shield className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tipo de Conta</p>
                      <Badge variant="default">Cliente</Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alterar Senha */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Segurança
              </CardTitle>
              <Button
                variant={isChangingPassword ? 'ghost' : 'outline'}
                size="sm"
                onClick={() => {
                  setIsChangingPassword(!isChangingPassword);
                  setPasswordMessage(null);
                  if (!isChangingPassword) {
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }
                }}
              >
                {isChangingPassword ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Alterar
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {isChangingPassword ? (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Senha Atual
                    </label>
                    <div className="relative">
                      <Input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('current')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showPasswords.current ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nova Senha
                    </label>
                    <div className="relative">
                      <Input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showPasswords.new ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar Nova Senha
                    </label>
                    <div className="relative">
                      <Input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {passwordMessage && (
                    <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                      passwordMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {passwordMessage.type === 'success' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <span className="text-sm">{passwordMessage.text}</span>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsChangingPassword(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={passwordLoading}
                    >
                      {passwordLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Alterando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Alterar
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Mantenha sua conta segura alterando sua senha regularmente.
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Shield className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Status da Conta</p>
                      <Badge variant="success">Segura</Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
