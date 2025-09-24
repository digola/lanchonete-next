'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Variantes do badge usando CVA
const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-800',
        primary: 'bg-primary-100 text-primary-800',
        secondary: 'bg-secondary-100 text-secondary-800',
        success: 'bg-success-100 text-success-800',
        warning: 'bg-warning-100 text-warning-800',
        destructive: 'bg-red-100 text-red-800',
        outline: 'border border-gray-300 text-gray-700',
        // Status específicos
        pending: 'bg-yellow-100 text-yellow-800',
        confirmed: 'bg-blue-100 text-blue-800',
        preparing: 'bg-orange-100 text-orange-800',
        ready: 'bg-green-100 text-green-800',
        delivered: 'bg-gray-100 text-gray-800',
        cancelled: 'bg-red-100 text-red-800',
        // Status de mesa
        free: 'bg-green-100 text-green-800',
        occupied: 'bg-red-100 text-red-800',
        reserved: 'bg-yellow-100 text-yellow-800',
        maintenance: 'bg-gray-100 text-gray-800',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
      dot: {
        true: 'pl-1',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      dot: false,
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotColor?: string;
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, dot, dotColor, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size, dot, className }))}
        {...props}
      >
        {dot && (
          <div 
            className="w-2 h-2 rounded-full mr-1.5"
            style={{ backgroundColor: dotColor || 'currentColor' }}
          />
        )}
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

// Componentes específicos para status
const StatusBadge = forwardRef<HTMLDivElement, BadgeProps & { status: string }>(
  ({ status, children, ...props }, ref) => {
    const getStatusVariant = (status: string) => {
      switch (status.toLowerCase()) {
        case 'pendente':
        case 'pending':
          return 'pending';
        case 'confirmado':
        case 'confirmed':
          return 'confirmed';
        case 'preparando':
        case 'preparing':
          return 'preparing';
        case 'pronto':
        case 'ready':
          return 'ready';
        case 'entregue':
        case 'delivered':
          return 'delivered';
        case 'cancelado':
        case 'cancelled':
          return 'cancelled';
        default:
          return 'default';
      }
    };

    return (
      <Badge
        ref={ref}
        variant={getStatusVariant(status)}
        {...props}
      >
        {children || status}
      </Badge>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

const TableStatusBadge = forwardRef<HTMLDivElement, BadgeProps & { status: string }>(
  ({ status, children, ...props }, ref) => {
    const getTableStatusVariant = (status: string) => {
      switch (status.toLowerCase()) {
        case 'livre':
        case 'free':
          return 'free';
        case 'ocupada':
        case 'occupied':
          return 'occupied';
        case 'reservada':
        case 'reserved':
          return 'reserved';
        case 'manutenção':
        case 'manutencao':
        case 'maintenance':
          return 'maintenance';
        default:
          return 'default';
      }
    };

    return (
      <Badge
        ref={ref}
        variant={getTableStatusVariant(status)}
        {...props}
      >
        {children || status}
      </Badge>
    );
  }
);

TableStatusBadge.displayName = 'TableStatusBadge';

const RoleBadge = forwardRef<HTMLDivElement, BadgeProps & { role: string }>(
  ({ role, children, ...props }, ref) => {
    const getRoleVariant = (role: string) => {
      switch (role.toLowerCase()) {
        case 'administrador':
        case 'admin':
          return 'destructive';
        case 'funcionario':
        case 'staff':
          return 'primary';
        case 'cliente':
        case 'client':
        case 'customer':
          return 'success';
        default:
          return 'default';
      }
    };

    return (
      <Badge
        ref={ref}
        variant={getRoleVariant(role)}
        {...props}
      >
        {children || role}
      </Badge>
    );
  }
);

RoleBadge.displayName = 'RoleBadge';

export { 
  Badge, 
  StatusBadge, 
  TableStatusBadge, 
  RoleBadge,
  badgeVariants 
};
