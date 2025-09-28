'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToastHelpers } from '@/components/ui/Toast';
import { TableStatus, UserRole, Table as TableType } from '@/types';
import { Table, Edit, Eye, Save, X, Users } from 'lucide-react';

// Schema de validação
const tableSchema = z.object({
  number: z.coerce.number().min(1, 'Número da mesa deve ser maior que 0'),
  capacity: z.coerce.number().min(1, 'Capacidade deve ser maior que 0').max(20, 'Capacidade máxima é 20'),
  status: z.nativeEnum(TableStatus, {
    errorMap: () => ({ message: 'Status inválido' }),
  }),
  assignedTo: z.string().optional(),
});

export type TableFormData = z.infer<typeof tableSchema>;

interface TableFormProps {
  table?: TableType;
  onSubmit: (data: TableFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit' | 'view';
  users?: Array<{ id: string; name: string; role: UserRole }>;
}

export function TableForm({ table, onSubmit, onCancel, isLoading = false, mode, users = [] }: TableFormProps) {
  const { success, error } = useToastHelpers();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<TableFormData>({
    resolver: zodResolver(tableSchema),
    defaultValues: {
      number: table?.number || 1,
      capacity: table?.capacity || 4,
      status: table?.status || TableStatus.LIVRE,
      assignedTo: table?.assignedTo || '',
    },
  });

  const watchedStatus = watch('status');
  const watchedAssignedTo = watch('assignedTo');

  useEffect(() => {
    if (table) {
      reset({
        number: table.number,
        capacity: table.capacity,
        status: table.status,
        assignedTo: table.assignedTo || '',
      });
    }
  }, [table, reset]);

  const handleFormSubmit = async (data: TableFormData) => {
    try {
      await onSubmit(data);
    } catch (err: any) {
      error(err.message || 'Erro ao salvar mesa');
    }
  };

  const getStatusLabel = (status: TableStatus) => {
    switch (status) {
      case TableStatus.LIVRE:
        return 'Livre';
      case TableStatus.OCUPADA:
        return 'Ocupada';
      default:
        return status;
    }
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case TableStatus.LIVRE:
        return 'bg-green-100 text-green-800';
      case TableStatus.OCUPADA:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssignedUser = () => {
    if (!watchedAssignedTo) return null;
    return users.find(user => user.id === watchedAssignedTo);
  };

  const isReadOnly = mode === 'view';

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={
        mode === 'create' ? 'Nova Mesa' :
        mode === 'edit' ? 'Editar Mesa' :
        'Visualizar Mesa'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Preview da mesa */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <Table className="h-6 w-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900">
                Mesa {watch('number') || 'N'}
              </h3>
              <p className="text-sm text-gray-600">
                Capacidade: {watch('capacity') || 0} pessoas
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(watchedStatus)}`}
                >
                  {getStatusLabel(watchedStatus)}
                </span>
                {getAssignedUser() && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getAssignedUser()?.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Número da Mesa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número da Mesa *
            </label>
            <Input
              {...register('number')}
              type="number"
              placeholder="Digite o número da mesa"
              error={errors.number?.message || ''}
              disabled={isReadOnly}
            />
          </div>

          {/* Capacidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capacidade *
            </label>
            <Input
              {...register('capacity')}
              type="number"
              placeholder="Digite a capacidade"
              error={errors.capacity?.message || ''}
              disabled={isReadOnly}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status *
            </label>
            <select
              {...register('status')}
              className="form-select block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              disabled={isReadOnly}
            >
              <option value={TableStatus.LIVRE}>Livre</option>
              <option value={TableStatus.OCUPADA}>Ocupada</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
            )}
          </div>

          {/* Funcionário Atribuído */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Funcionário Atribuído
            </label>
            <select
              {...register('assignedTo')}
              className="form-select block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              disabled={isReadOnly}
            >
              <option value="">Nenhum</option>
              {users
                .filter(user => user.role === UserRole.STAFF || user.role === UserRole.ADMIN)
                .map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role === UserRole.STAFF ? 'Staff' : 'Admin'})
                  </option>
                ))}
            </select>
            {errors.assignedTo && (
              <p className="mt-1 text-sm text-red-600">{errors.assignedTo.message}</p>
            )}
          </div>
        </div>

        {/* Informações adicionais */}
        {table && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Informações do Sistema</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">ID:</span> {table.id}
              </div>
              <div>
                <span className="font-medium">Criado em:</span>{' '}
                {new Date(table.createdAt).toLocaleString('pt-BR')}
              </div>
              <div>
                <span className="font-medium">Atualizado em:</span>{' '}
                {new Date(table.updatedAt).toLocaleString('pt-BR')}
              </div>
              {table.assignedUser && (
                <div>
                  <span className="font-medium">Atribuído a:</span> {table.assignedUser.name}
                </div>
              )}
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
              {mode === 'create' ? 'Criar Mesa' : 'Salvar Alterações'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}