'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToastHelpers } from '@/components/ui/Toast';
import { UserRole, User as UserType } from '@/types';
import { User, Edit, Eye, Save, X } from 'lucide-react';

// Schema de validação
const userSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: 'Role inválido' }),
  }),
  isActive: z.union([z.boolean(), z.string()]).transform((val) => {
    if (typeof val === 'boolean') return val;
    return val === 'true';
  }),
});

export type UserFormData = z.infer<typeof userSchema>;

// Tipo para o formulário que aceita string no isActive
type UserFormDataWithString = Omit<UserFormData, 'isActive'> & {
  isActive: string;
};

interface UserFormProps {
  user?: UserType;
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit' | 'view';
}

export function UserForm({ user, onSubmit, onCancel, isLoading = false, mode }: UserFormProps) {
  const { success, error } = useToastHelpers();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<UserFormDataWithString>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      password: '',
      role: user?.role || UserRole.CUSTOMER,
      isActive: user?.isActive ? 'true' : 'false',
    },
  });

  const watchedRole = watch('role');
  const watchedIsActive = watch('isActive');

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        isActive: user.isActive ? 'true' : 'false',
      });
    }
  }, [user, reset]);

  const handleFormSubmit = async (data: UserFormDataWithString) => {
    try {
      // Converter isActive de string para boolean
      const processedData: UserFormData = {
        ...data,
        isActive: data.isActive === 'true',
      };

      // Se é modo de edição e não há senha, remover do payload
      if (mode === 'edit' && !processedData.password) {
        const { password, ...dataWithoutPassword } = processedData;
        await onSubmit(dataWithoutPassword as UserFormData);
      } else {
        await onSubmit(processedData);
      }
    } catch (err: any) {
      error(err.message || 'Erro ao salvar usuário');
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.CUSTOMER:
        return 'Customer';
      case UserRole.STAFF:
        return 'Staff';
      case UserRole.MANAGER:
        return 'Manager';
      case UserRole.ADMIN:
        return 'Admin';
      default:
        return role;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.CUSTOMER:
        return 'bg-blue-100 text-blue-800';
      case UserRole.STAFF:
        return 'bg-green-100 text-green-800';
      case UserRole.MANAGER:
        return 'bg-purple-100 text-purple-800';
      case UserRole.ADMIN:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isReadOnly = mode === 'view';

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={
        mode === 'create' ? 'Novo Usuário' :
        mode === 'edit' ? 'Editar Usuário' :
        'Visualizar Usuário'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Preview do usuário */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900">
                {watch('name') || 'Nome do usuário'}
              </h3>
              <p className="text-sm text-gray-600">{watch('email') || 'email@exemplo.com'}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(watchedRole)}`}
                >
                  {getRoleLabel(watchedRole)}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    watchedIsActive === 'true' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {watchedIsActive === 'true' ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo *
            </label>
            <Input
              {...register('name')}
              placeholder="Digite o nome completo"
              error={errors.name?.message || ''}
              disabled={isReadOnly}
            />
          </div>

          {/* Email */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <Input
              {...register('email')}
              type="email"
              placeholder="Digite o email"
              error={errors.email?.message || ''}
              disabled={isReadOnly}
            />
          </div>

          {/* Senha */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {mode === 'create' ? 'Senha *' : 'Nova Senha (deixe em branco para manter a atual)'}
            </label>
            <div className="relative">
              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'create' ? 'Digite a senha' : 'Digite a nova senha'}
                error={errors.password?.message || ''}
                disabled={isReadOnly}
              />
              {!isReadOnly && (
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Eye className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Função *
            </label>
            <select
              {...register('role')}
              className="form-select block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              disabled={isReadOnly}
            >
              <option value={UserRole.CUSTOMER}>Customer</option>
              <option value={UserRole.STAFF}>Staff</option>
              <option value={UserRole.MANAGER}>Manager</option>
              <option value={UserRole.ADMIN}>Admin</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              {...register('isActive', { 
                setValueAs: (value) => value === 'true' || value === true 
              })}
              className="form-select block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              disabled={isReadOnly}
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
            {errors.isActive && (
              <p className="mt-1 text-sm text-red-600">{errors.isActive.message}</p>
            )}
          </div>
        </div>

        {/* Informações adicionais */}
        {user && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Informações do Sistema</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">ID:</span> {user.id}
              </div>
              <div>
                <span className="font-medium">Criado em:</span>{' '}
                {new Date(user.createdAt).toLocaleString('pt-BR')}
              </div>
              <div>
                <span className="font-medium">Atualizado em:</span>{' '}
                {new Date(user.updatedAt).toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            {isReadOnly ? 'Fechar' : 'Cancelar'}
          </Button>
          
          {!isReadOnly && (
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !isDirty}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {mode === 'create' ? 'Criar Usuário' : 'Salvar Alterações'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}