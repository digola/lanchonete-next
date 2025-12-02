'use client';

// Sistema simples de toast sem context
/**
 * Sistema simples de notificações (toast) baseado em DOM, sem uso de Context.
 *
 * Características:
 * - Cria dinamicamente um container fixo no canto superior direito.
 * - Renderiza toasts com ícone e cores conforme o tipo (success, error, warning, info).
 * - Fecha automaticamente após 5 segundos, com animação de saída.
 * - Permite fechar manualmente via botão.
 *
 * Uso:
 *   import { toast } from '@/lib/toast';
 *   toast.success('Pedido criado', 'O pedido #123 foi registrado.');
 *
 * Observação: projetado para ambientes client-side (Next.js 'use client').
 */
class ToastManager {
  private container: HTMLElement | null = null;
  private toasts: Map<string, HTMLElement> = new Map();

  /**
   * Cria ou retorna o container de toasts fixo no documento.
   * @returns Container onde os toasts são anexados.
   */
  private createContainer() {
    if (this.container) return this.container;

    this.container = document.createElement('div');
    this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
    this.container.id = 'toast-container';
    document.body.appendChild(this.container);
    
    return this.container;
  }

  /**
   * Cria um toast visual e agenda sua remoção automática.
   * @param type Tipo de toast: 'success' | 'error' | 'warning' | 'info'.
   * @param title Título em destaque do toast.
   * @param description Texto complementar opcional abaixo do título.
   * @returns ID interno do toast criado.
   */
  private createToast(type: 'success' | 'error' | 'warning' | 'info', title: string, description?: string) {
    const container = this.createContainer();
    const id = Math.random().toString(36).substr(2, 9);
    
    const toast = document.createElement('div');
    toast.className = `
      max-w-sm w-full bg-white border rounded-lg shadow-lg p-4 transition-all duration-300 transform
      ${this.getBackgroundColor(type)}
      translate-x-0 opacity-100
    `;

    const icon = this.getIcon(type);
    const iconColor = this.getIconColor(type);

    toast.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          ${icon}
        </div>
        <div class="ml-3 flex-1">
          <p class="text-sm font-medium text-gray-900">${title}</p>
          ${description ? `<p class="mt-1 text-sm text-gray-600">${description}</p>` : ''}
        </div>
        <div class="ml-4 flex-shrink-0">
          <button class="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none" data-toast-id="${id}">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Adicionar evento de fechar
    const closeBtn = toast.querySelector(`[data-toast-id="${id}"]`);
    closeBtn?.addEventListener('click', () => {
      this.removeToast(id);
    });

    container.appendChild(toast);
    this.toasts.set(id, toast);

    // Auto remove após 5 segundos
    setTimeout(() => {
      this.removeToast(id);
    }, 5000);

    return id;
  }

  /**
   * Retorna classes de background/borda baseadas no tipo de toast.
   * @param type Tipo do toast.
   * @returns Classes CSS Tailwind para cores de fundo e borda.
   */
  private getBackgroundColor(type: string): string {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  }

  /**
   * SVG de ícone de acordo com o tipo do toast.
   * @param type Tipo do toast.
   * @returns SVG inline.
   */
  private getIcon(type: string): string {
    switch (type) {
      case 'success':
        return '<svg class="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
      case 'error':
        return '<svg class="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
      case 'warning':
        return '<svg class="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>';
      case 'info':
        return '<svg class="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
      default:
        return '<svg class="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
    }
  }

  /**
   * Classe de cor principal aplicada ao ícone do toast.
   * @param type Tipo do toast.
   * @returns Classe CSS Tailwind.
   */
  private getIconColor(type: string): string {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      default: return 'text-blue-600';
    }
  }

  /**
   * Remove um toast existente com animação de saída.
   * @param id ID do toast a ser removido.
   */
  private removeToast(id: string) {
    const toast = this.toasts.get(id);
    if (toast) {
      toast.style.transform = 'translateX(100%)';
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.remove();
        this.toasts.delete(id);
      }, 300);
    }
  }

  /**
   * Mostra um toast de sucesso.
   * @param title Título do toast.
   * @param description Descrição opcional.
   */
  success(title: string, description?: string) {
    this.createToast('success', title, description);
  }

  /**
   * Mostra um toast de erro.
   * @param title Título do toast.
   * @param description Descrição opcional.
   */
  error(title: string, description?: string) {
    this.createToast('error', title, description);
  }

  /**
   * Mostra um toast de aviso.
   * @param title Título do toast.
   * @param description Descrição opcional.
   */
  warning(title: string, description?: string) {
    this.createToast('warning', title, description);
  }

  /**
   * Mostra um toast informativo.
   * @param title Título do toast.
   * @param description Descrição opcional.
   */
  info(title: string, description?: string) {
    this.createToast('info', title, description);
  }
}

/**
 * Instância singleton utilizada em toda a aplicação.
 */
export const toast = new ToastManager();
