'use client';

import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { Button } from './Button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  ordersData?: { [key: string]: number }; // Data no formato 'YYYY-MM-DD' -> quantidade de pedidos
  className?: string;
  showHeader?: boolean;
}

export function Calendar({ 
  selectedDate, 
  onDateSelect, 
  ordersData = {}, 
  className,
  showHeader = true 
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Gerar dias do mês atual - memoizado para melhor performance
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    // Adicionar dias vazios no início para alinhar com o calendário
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - monthStart.getDay());
    
    const endDate = new Date(monthEnd);
    endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const getOrdersCount = useMemo(() => (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return ordersData[dateKey] || 0;
  }, [ordersData]);

  const isSelected = useMemo(() => (date: Date) => {
    return selectedDate && isSameDay(date, selectedDate);
  }, [selectedDate]);

  const isCurrentMonth = useMemo(() => (date: Date) => {
    return isSameMonth(date, currentMonth);
  }, [currentMonth]);

  const isCurrentDay = useMemo(() => (date: Date) => {
    return isToday(date);
  }, []);

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg shadow-sm', className)}>
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePreviousMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Dias do calendário */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const ordersCount = getOrdersCount(day);
            const hasOrders = ordersCount > 0;
            
            return (
              <button
                key={index}
                onClick={() => handleDateClick(day)}
                className={cn(
                  'relative h-10 w-full text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
                  {
                    // Cores baseadas no mês
                    'text-gray-400': !isCurrentMonth(day),
                    'text-gray-900': isCurrentMonth(day),
                    
                    // Destaque para hoje
                    'bg-blue-100 text-blue-900 font-semibold': isCurrentDay(day) && !isSelected(day),
                    
                    // Destaque para data selecionada
                    'bg-blue-600 text-white font-semibold': isSelected(day),
                    
                    // Hover para datas do mês atual
                    'hover:bg-gray-100': isCurrentMonth(day) && !isSelected(day) && !isCurrentDay(day),
                  }
                )}
              >
                <span>{format(day, 'd')}</span>
                
                {/* Indicador de pedidos */}
                {hasOrders && isCurrentMonth(day) && (
                  <div className="absolute -top-1 -right-1">
                    <div className={cn(
                      'h-2 w-2 rounded-full',
                      {
                        'bg-blue-400': !isSelected(day),
                        'bg-white': isSelected(day),
                      }
                    )} />
                  </div>
                )}
                
                {/* Tooltip com quantidade de pedidos */}
                {hasOrders && isCurrentMonth(day) && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {ordersCount} pedido{ordersCount !== 1 ? 's' : ''}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Componente compacto para mostrar apenas o calendário sem cabeçalho
export function CalendarCompact({ 
  selectedDate, 
  onDateSelect, 
  ordersData = {}, 
  className 
}: Omit<CalendarProps, 'showHeader'>) {
  return (
    <Calendar
      selectedDate={selectedDate}
      onDateSelect={onDateSelect}
      ordersData={ordersData}
      className={className}
      showHeader={false}
    />
  );
}
