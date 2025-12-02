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

/**
 * usePublicSettings
 *
 * Hook para carregar configurações públicas do restaurante (sem necessidade
 * de autenticação). Fornece estado reativo e helpers para formatar dias e
 * horários de funcionamento.
 *
 * @returns {object} settings, loading, error, getWorkingDaysText, getWorkingHoursText
 */
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
          console.log('Configurações públicas carregadas usepublic:', data.data);
          setSettings(data.data);
          
        } else {
          console.log('Configurações públicas carregadas usepublic:', );
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

  /**
   * getWorkingDaysText
   *
   * Formata os dias de funcionamento em um texto amigável.
   * Aceita array de dias em inglês e retorna rótulos em português.
   */
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

  /**
   * getWorkingHoursText
   *
   * Formata os horários de abertura/fechamento em um texto amigável
   * no padrão HHhmm, omitindo minutos quando são "00".
   */
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
    teste:'teste'
  };
}
    