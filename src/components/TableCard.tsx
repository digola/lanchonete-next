'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TableStatusBadge } from '@/components/ui/Badge';
import { Table, TableStatus } from '@/types';
import { Users, User, Clock, MapPin } from 'lucide-react';

interface TableCardProps {
  table: Table;
  onAssignTable?: (table: Table) => void;
  onFreeTable?: (table: Table) => void;
  onViewDetails?: (table: Table) => void;
  showActions?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'grid';
}

export const TableCard = ({
  table,
  onAssignTable,
  onFreeTable,
  onViewDetails,
  showActions = true,
  className,
  variant = 'default',
}: TableCardProps) => {
  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case TableStatus.LIVRE:
        return 'bg-green-500';
      case TableStatus.OCUPADA:
        return 'bg-red-500';
      case TableStatus.RESERVADA:
        return 'bg-yellow-500';
      case TableStatus.MANUTENCAO:
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: TableStatus) => {
    switch (status) {
      case TableStatus.LIVRE:
        return <div className="w-3 h-3 bg-green-500 rounded-full" />;
      case TableStatus.OCUPADA:
        return <div className="w-3 h-3 bg-red-500 rounded-full" />;
      case TableStatus.RESERVADA:
        return <div className="w-3 h-3 bg-yellow-500 rounded-full" />;
      case TableStatus.MANUTENCAO:
        return <div className="w-3 h-3 bg-gray-500 rounded-full" />;
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
    }
  };

  const handleAssignTable = () => {
    if (onAssignTable) {
      onAssignTable(table);
    }
  };

  const handleFreeTable = () => {
    if (onFreeTable) {
      onFreeTable(table);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(table);
    }
  };

  if (variant === 'compact') {
    return (
      <Card className={`transition-all duration-200 hover:shadow-medium ${className}`}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(table.status)}
              <div>
                <p className="font-medium text-gray-900">
                  Mesa {table.number}
                </p>
                <p className="text-sm text-gray-600">
                  {table.capacity} lugares
                </p>
              </div>
            </div>
            <TableStatusBadge status={table.status} size="sm" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'grid') {
    return (
      <Card 
        className={`transition-all duration-200 hover:shadow-medium cursor-pointer ${
          table.status === TableStatus.OCUPADA ? 'ring-2 ring-red-200' : ''
        } ${className}`}
        onClick={handleViewDetails}
      >
        <CardContent className="p-4 text-center">
          <div className="space-y-3">
            {/* Status Indicator */}
            <div className="flex justify-center">
              <div className={`w-4 h-4 rounded-full ${getStatusColor(table.status)}`} />
            </div>
            
            {/* Table Number */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {table.number}
              </h3>
              <p className="text-sm text-gray-600">
                Mesa {table.number}
              </p>
            </div>

            {/* Capacity */}
            <div className="flex items-center justify-center space-x-1 text-gray-600">
              <Users className="h-4 w-4" />
              <span className="text-sm">{table.capacity}</span>
            </div>

            {/* Status Badge */}
            <TableStatusBadge status={table.status} size="sm" />

            {/* Assigned User */}
            {table.assignedUser && (
              <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
                <User className="h-3 w-3" />
                <span className="truncate">{table.assignedUser.name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`transition-all duration-200 hover:shadow-medium ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(table.status)}
              <div>
                <h3 className="font-semibold text-gray-900">
                  Mesa {table.number}
                </h3>
                <p className="text-sm text-gray-600">
                  {table.capacity} lugares
                </p>
              </div>
            </div>
            <TableStatusBadge status={table.status} />
          </div>

          {/* Status Details */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                Status: {table.status.toLowerCase()}
              </span>
            </div>

            {table.assignedUser && (
              <div className="flex items-center space-x-2 text-sm">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  Responsável: {table.assignedUser.name}
                </span>
              </div>
            )}

            {table.currentOrderId && (
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  Pedido ativo: #{table.currentOrderId.slice(-8)}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex space-x-2 pt-3 border-t">
              {onViewDetails && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewDetails}
                  className="flex-1"
                >
                  Ver Detalhes
                </Button>
              )}

              {table.status === TableStatus.LIVRE && onAssignTable && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAssignTable}
                  className="flex-1"
                >
                  Ocupar Mesa
                </Button>
              )}

              {table.status === TableStatus.OCUPADA && onFreeTable && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleFreeTable}
                  className="flex-1"
                >
                  Liberar Mesa
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Componente para grid de mesas
interface TableGridProps {
  tables: Table[];
  onAssignTable?: (table: Table) => void;
  onFreeTable?: (table: Table) => void;
  onViewDetails?: (table: Table) => void;
  showActions?: boolean;
  className?: string;
}

export const TableGrid = ({
  tables,
  onAssignTable,
  onFreeTable,
  onViewDetails,
  showActions = true,
  className,
}: TableGridProps) => {
  const sortedTables = [...tables].sort((a, b) => a.number - b.number);

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 ${className}`}>
      {sortedTables.map((table) => (
        <TableCard
          key={table.id}
          table={table}
          {...(onAssignTable && { onAssignTable })}
          {...(onFreeTable && { onFreeTable })}
          {...(onViewDetails && { onViewDetails })}
          {...(showActions !== undefined && { showActions })}
          variant="grid"
        />
      ))}
    </div>
  );
};

// Componente para lista de mesas
interface TableListProps {
  tables: Table[];
  onAssignTable?: (table: Table) => void;
  onFreeTable?: (table: Table) => void;
  onViewDetails?: (table: Table) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact';
  className?: string;
}

export const TableList = ({
  tables,
  onAssignTable,
  onFreeTable,
  onViewDetails,
  showActions = true,
  variant = 'default',
  className,
}: TableListProps) => {
  if (tables.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🪑</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhuma mesa encontrada
        </h3>
        <p className="text-gray-600">
          Configure as mesas do restaurante para começar a usá-las.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {tables.map((table) => (
        <TableCard
          key={table.id}
          table={table}
          {...(onAssignTable && { onAssignTable })}
          {...(onFreeTable && { onFreeTable })}
          {...(onViewDetails && { onViewDetails })}
          {...(showActions !== undefined && { showActions })}
          {...(variant && { variant })}
        />
      ))}
    </div>
  );
};

export default TableCard;
