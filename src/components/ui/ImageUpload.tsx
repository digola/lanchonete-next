'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from './Button';
import { toast } from '@/lib/toast';
import { useApiAuth } from '@/hooks/useApiAuth';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function ImageUpload({ 
  value, 
  onChange, 
  placeholder = "Clique para selecionar uma imagem",
  disabled = false,
  error,
  className = ""
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // const { success, error: showError } = useToastHelpers();
  const { token } = useApiAuth();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use JPG, PNG ou WebP');
      return;
    }

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Máximo 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Criar preview local
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Fazer upload para o servidor
      const formData = new FormData();
      formData.append('image', file);

      if (!token) {
        toast.error('Você precisa estar logado para fazer upload de imagens');
        return;
      }

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao fazer upload');
      }

      // Atualizar com a URL do servidor
      setPreview(result.data.url);
      onChange(result.data.url);
      toast.success('Imagem enviada com sucesso!');

    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast.error(error.message || 'Erro ao fazer upload da imagem');
      setPreview(null);
      onChange(null);
    } finally {
      setIsUploading(false);
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Área de upload */}
      <div
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${error 
            ? 'border-red-300 bg-red-50' 
            : preview 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}
        `}
      >
        {isUploading ? (
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
            <p className="text-sm text-gray-600">Enviando imagem...</p>
          </div>
        ) : preview ? (
          <div className="space-y-3">
            <div className="relative inline-block">
              <Image
                src={preview}
                alt="Preview"
                width={96}
                height={96}
                className="h-24 w-24 object-cover rounded-lg mx-auto"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-sm text-green-600">Imagem selecionada</p>
            <p className="text-xs text-gray-500">Clique para alterar</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="p-3 bg-gray-100 rounded-full">
              {error ? (
                <ImageIcon className="h-6 w-6 text-red-500" />
              ) : (
                <Upload className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <p className={`text-sm ${error ? 'text-red-600' : 'text-gray-600'}`}>
              {error || placeholder}
            </p>
            <p className="text-xs text-gray-500">
              JPG, PNG ou WebP • Máximo 5MB
            </p>
          </div>
        )}
      </div>

      {/* Mensagem de erro */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
