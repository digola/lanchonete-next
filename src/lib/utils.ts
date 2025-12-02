import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina classes CSS usando clsx e tailwind-merge.
 * Remove conflitos de classes do Tailwind e combina classes condicionais.
 *
 * @example
 * cn('p-2', condition && 'bg-red-500', 'p-4') // resolve para 'p-4 bg-red-500'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata número para moeda brasileira (BRL) com locale pt-BR.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata data para padrão brasileiro dd/mm/aaaa.
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Formata data e hora para padrão brasileiro dd/mm/aaaa hh:mm.
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Formata tempo relativo (ex.: "há 2 horas").
 * Quando acima de 30 dias, retorna a data formatada.
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'agora';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `há ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
  }

  return formatDate(d);
}

/**
 * Gera slug a partir de uma string: minúsculas, sem acentos e com hífens.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim();
}

/**
 * Trunca texto no tamanho desejado e adiciona reticências.
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Capitaliza a primeira letra da string.
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Cria uma função debounced: adia a execução até que não haja novas chamadas
 * por um período (wait).
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Cria uma função throttled: garante execução no máximo uma vez por intervalo
 * (limit), ignorando chamadas no meio do período.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Valida email com regex simples.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida CPF (11 dígitos) com cálculo dos dígitos verificadores.
 */
export function isValidCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  cpf = cpf.replace(/[^\d]/g, '');

  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  let digit1 = remainder < 2 ? 0 : remainder;

  if (parseInt(cpf.charAt(9)) !== digit1) return false;

  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  let digit2 = remainder < 2 ? 0 : remainder;

  return parseInt(cpf.charAt(10)) === digit2;
}

/**
 * Valida telefone brasileiro (10 ou 11 dígitos).
 */
export function isValidPhone(phone: string): boolean {
  // Remove caracteres não numéricos
  phone = phone.replace(/[^\d]/g, '');

  // Verifica se tem 10 ou 11 dígitos
  return phone.length === 10 || phone.length === 11;
}

/**
 * Formata telefone brasileiro, suportando padrões de 10 e 11 dígitos.
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[^\d]/g, '');
  
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
}

/**
 * Formata CPF para o padrão xxx.xxx.xxx-xx.
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/[^\d]/g, '');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Gera ID pseudo-único curto (uso não-criptográfico).
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Clona objeto profundamente, com suporte básico a Array e Date.
 * Não preserva protótipos avançados nem funções.
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}

/**
 * Verifica se valor é vazio: null/undefined, array/string vazios,
 * ou objeto sem chaves próprias.
 */
export function isEmpty(obj: any): boolean {
  if (obj == null) return true;
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
}

/**
 * Ordena um array por propriedade (asc/desc) sem mutar o original.
 */
export function sortBy<T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Agrupa elementos do array pela representação em string da propriedade.
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    groups[groupKey] = groups[groupKey] || [];
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Remove duplicatas mantendo a ordem utilizando Set.
 */
export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/**
 * Verifica viewport para determinar se é dispositivo mobile (width < 768).
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

/**
 * Verifica viewport para determinar se é dispositivo tablet (768 <= width < 1024).
 */
export function isTablet(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 768 && window.innerWidth < 1024;
}

/**
 * Verifica viewport para determinar se é desktop (width >= 1024).
 */
export function isDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 1024;
}

/**
 * Realiza scroll suave até o elemento informado, com offset opcional.
 */
export function smoothScrollTo(element: HTMLElement | null, offset: number = 0): void {
  if (!element) return;
  
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
}

/**
 * Copia texto para a área de transferência (clipboard) usando API do navegador.
 * Retorna true em caso de sucesso; false caso contrário.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Erro ao copiar para clipboard:', error);
    return false;
  }
}

/**
 * safeJSONParse
 * Faz parse seguro de JSON, retornando valor default em caso de erro.
 * Opcionalmente valida o tipo/estrutura básica do resultado.
 */
export function safeJSONParse<T = any>(
  input: string | null | undefined,
  defaultValue: T,
  validate?: (value: any) => boolean
): T {
  try {
    if (!input || typeof input !== 'string') return defaultValue;
    const trimmed = input.trim();
    if (trimmed === '' || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) {
      return defaultValue;
    }
    const parsed = JSON.parse(trimmed);
    if (validate && !validate(parsed)) {
      return defaultValue;
    }
    return parsed as T;
  } catch (err) {
    console.error('safeJSONParse error:', err);
    return defaultValue;
  }
}

/**
 * Valida payload básico de JWT (sem assinatura), útil para decodificações client-side.
 */
export function isValidJwtPayload(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  const hasRequired = typeof obj.userId === 'string' && typeof obj.email === 'string' && obj.role != null;
  // exp/iat são opcionais, porém quando presentes devem ser números
  const expOk = obj.exp == null || typeof obj.exp === 'number';
  const iatOk = obj.iat == null || typeof obj.iat === 'number';
  return hasRequired && expOk && iatOk;
}

/**
 * Tenta ler string do storage com fallback seguro.
 */
export function safeStorageGet(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch (err) {
    console.error(`Erro ao ler storage (${key}):`, err);
    return null;
  }
}

/**
 * Tenta salvar/remover no storage com tratamento de erro.
 */
export function safeStorageSet(storage: Storage, key: string, value: string | null): void {
  try {
    if (value == null) {
      storage.removeItem(key);
    } else {
      storage.setItem(key, value);
    }
  } catch (err) {
    console.error(`Erro ao escrever storage (${key}):`, err);
  }
}
