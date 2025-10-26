'use client';

import { forwardRef, InputHTMLAttributes, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Variantes do input usando CVA
const inputVariants = cva(
  'block w-full rounded-lg border px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none transition-colors duration-200 disabled:bg-gray-50 disabled:text-gray-500',
  {
    variants: {
      variant: {
        default: 'border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500',
        error: 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500',
        success: 'border-green-500 focus:border-green-500 focus:ring-1 focus:ring-green-500',
        warning: 'border-yellow-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500',
      },
      size: {
        sm: 'px-2 py-1.5 text-sm',
        md: 'px-3 py-2 text-base',
        lg: 'px-4 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    variant, 
    size, 
    label,
    error,
    helper,
    leftIcon,
    rightIcon,
    leftAddon,
    rightAddon,
    fullWidth = true,
    type,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    // Determinar variante baseada no erro
    const inputVariant = error ? 'error' : variant;

    const inputElement = (
      <div className="relative">
        {/* Left Addon */}
        {leftAddon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm">{leftAddon}</span>
          </div>
        )}

        {/* Left Icon */}
        {leftIcon && !leftAddon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">{leftIcon}</span>
          </div>
        )}

        {/* Input */}
        <input
          type={isPassword && showPassword ? 'text' : type}
          className={cn(
            inputVariants({ variant: inputVariant, size, className }),
            {
              'pl-10': leftIcon || leftAddon,
              'pr-10': rightIcon || rightAddon || isPassword,
              'w-full': fullWidth,
            }
          )}
          ref={ref}
          {...props}
        />

        {/* Right Icon */}
        {rightIcon && !rightAddon && !isPassword && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400">{rightIcon}</span>
          </div>
        )}

        {/* Password Toggle */}
        {isPassword && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
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
        )}

        {/* Right Addon */}
        {rightAddon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm">{rightAddon}</span>
          </div>
        )}
      </div>
    );

    // Se não tem label, retornar apenas o input
    if (!label && !error && !helper) {
      return inputElement;
    }

    // Retornar input com label e mensagens
    return (
      <div className={cn('space-y-1', { 'w-full': fullWidth })}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Input */}
        {inputElement}

        {/* Helper Text */}
        {helper && !error && (
          <p className="text-sm text-gray-500">{helper}</p>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center space-x-1">
            <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };
