'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useToastHelpers } from '@/components/ui/Toast';
import { Category } from '@/types';
import { 
  Folder, 
  Palette, 
  Type,
  Save,
  X,
  Eye
} from 'lucide-react';

interface CategoryFormProps {
  category?: Category;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit' | 'view';
}

export interface CategoryFormData {
  name: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
}

export function CategoryForm({ 
  category, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  mode 
}: CategoryFormProps) {
  const { success, error } = useToastHelpers();
  
  const [formData, setFormData] = useState<CategoryFormData>({
    name: category?.name || '',
    description: category?.description || '',
    icon: category?.icon || '📦',
    color: category?.color || '#3B82F6',
    isActive: category?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        icon: category.icon || '📦',
        color: category.color || '#3B82F6',
        isActive: category.isActive,
      });
    }
  }, [category]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (formData.name.length > 50) {
      newErrors.name = 'Nome deve ter no máximo 50 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      error('Por favor, corrija os erros no formulário');
      return;
    }

    try {
      await onSubmit(formData);
      success(mode === 'create' ? 'Categoria criada com sucesso!' : 'Categoria atualizada com sucesso!');
    } catch (err) {
      error('Erro ao salvar categoria');
      console.error(err);
    }
  };

  const handleInputChange = (field: keyof CategoryFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const isReadOnly = mode === 'view';
  const canEdit = mode === 'create' || mode === 'edit';

  // Cores pré-definidas para categorias
  const predefinedColors = [
    { name: 'Azul', value: '#3B82F6' },
    { name: 'Verde', value: '#10B981' },
    { name: 'Vermelho', value: '#EF4444' },
    { name: 'Amarelo', value: '#F59E0B' },
    { name: 'Roxo', value: '#8B5CF6' },
    { name: 'Rosa', value: '#EC4899' },
    { name: 'Laranja', value: '#F97316' },
    { name: 'Cinza', value: '#6B7280' },
  ];

  // Ícones pré-definidos
  const predefinedIcons = [
    '🍔', '🍕', '🌭', '🥗', '🍜', '🍝', '🍱', '🥘',
    '☕', '🥤', '🍹', '🍺', '🍷', '🥃', '🧊', '🍰',
    '🧁', '🍪', '🍫', '🍬', '🍭', '🍮', '🍯', '🥜',
    '📦', '🏷️', '⭐', '🔥', '💎', '🎯', '🌟', '💫'
  ];

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={
        mode === 'create' ? 'Nova Categoria' :
        mode === 'edit' ? 'Editar Categoria' :
        'Detalhes da Categoria'
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Type className="h-4 w-4" />
              <span>Informações Básicas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Categoria *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ex: Lanches, Bebidas, Sobremesas"
                disabled={isReadOnly}
                error={errors.name || ''}
                maxLength={50}
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.name.length}/50 caracteres
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva a categoria..."
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 border-gray-300 ${
                  isReadOnly ? 'bg-gray-50' : ''
                }`}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                disabled={isReadOnly}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Categoria ativa
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Aparência */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Palette className="h-4 w-4" />
              <span>Aparência</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Ícone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ícone
              </label>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{formData.icon}</span>
                  <Input
                    value={formData.icon}
                    onChange={(e) => handleInputChange('icon', e.target.value)}
                    placeholder="Emoji ou texto"
                    disabled={isReadOnly}
                    className="flex-1"
                  />
                </div>
                
                {canEdit && (
                  <div className="grid grid-cols-8 gap-2">
                    {predefinedIcons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => handleInputChange('icon', icon)}
                        className={`p-2 text-lg rounded border-2 transition-colors ${
                          formData.icon === icon
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cor
              </label>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded border-2 border-gray-300"
                    style={{ backgroundColor: formData.color }}
                  />
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    disabled={isReadOnly}
                    className="w-20 h-10 p-1"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    placeholder="#3B82F6"
                    disabled={isReadOnly}
                    className="flex-1"
                  />
                </div>
                
                {canEdit && (
                  <div className="grid grid-cols-4 gap-2">
                    {predefinedColors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => handleInputChange('color', color.value)}
                        className={`p-3 rounded border-2 transition-colors ${
                          formData.color === color.value
                            ? 'border-primary-500'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-dashed border-gray-300">
              <span className="text-2xl">{formData.icon}</span>
              <div className="flex-1">
                <h3 
                  className="font-semibold text-lg"
                  style={{ color: formData.color }}
                >
                  {formData.name || 'Nome da categoria'}
                </h3>
                {formData.description && (
                  <p className="text-gray-600 text-sm">
                    {formData.description}
                  </p>
                )}
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                formData.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {formData.isActive ? 'Ativa' : 'Inativa'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {isReadOnly ? 'Fechar' : 'Cancelar'}
          </Button>
          
          {canEdit && (
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              leftIcon={isLoading ? undefined : <Save className="h-4 w-4" />}
            >
              {isLoading ? 'Salvando...' : mode === 'create' ? 'Criar Categoria' : 'Salvar Alterações'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
