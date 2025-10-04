import { useState, useEffect } from 'react';

export interface PublicSettings {
  restaurantName: string;
  restaurantAddress: string;
  restaurantPhone: string;
  restaurantEmail: string;
  openingTime: string;
  closingTime: string;
  workingDays: string[];
  currency: string;
  language: string;
}

export function usePublicSettings() {
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/settings/public');
        const data = await response.json();
        
        if (data.success) {
          setSettings(data.data);
        } else {
          setError('Erro ao carregar configurações');
        }
      } catch (err) {
        setError('Erro ao carregar configurações');
        console.error('Erro ao buscar configurações públicas:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Função para formatar os dias de funcionamento
  const getWorkingDaysText = () => {
    if (!settings?.workingDays) return 'Consulte nossos horários';
    
    const dayNames = {
      monday: 'Segunda',
      tuesday: 'Terça',
      wednesday: 'Quarta',
      thursday: 'Quinta',
      friday: 'Sexta',
      saturday: 'Sábado',
      sunday: 'Domingo',
    };
    
    const sortedDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      .filter(day => settings.workingDays.includes(day));
    
    if (sortedDays.length === 0) return 'Consulte nossos horários';
    
    const dayTexts = sortedDays.map(day => dayNames[day as keyof typeof dayNames]);
    
    if (dayTexts.length === 7) {
      return 'Todos os dias';
    } else if (dayTexts.length === 5 && !sortedDays.includes('saturday') && !sortedDays.includes('sunday')) {
      return 'Segunda a Sexta';
    } else {
      return dayTexts.join(', ');
    }
  };

  // Função para formatar o horário de funcionamento
  const getWorkingHoursText = () => {
    if (!settings?.openingTime || !settings?.closingTime) {
      return 'Consulte nossos horários';
    }
    
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      return `${hours}h${minutes === '00' ? '' : minutes}`;
    };
    
    const opening = formatTime(settings.openingTime);
    const closing = formatTime(settings.closingTime);
    
    return `${opening} às ${closing}`;
  };

  return {
    settings,
    loading,
    error,
    getWorkingDaysText,
    getWorkingHoursText,
  };
}
