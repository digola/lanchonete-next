'use client';

// Sistema simples de toast sem context
class ToastManager {
  private container: HTMLElement | null = null;
  private toasts: Map<string, HTMLElement> = new Map();

  private createContainer() {
    if (this.container) return this.container;

    this.container = document.createElement('div');
    this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
    this.container.id = 'toast-container';
    document.body.appendChild(this.container);
    
    return this.container;
  }

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

  private getBackgroundColor(type: string): string {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  }

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

  private getIconColor(type: string): string {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      default: return 'text-blue-600';
    }
  }

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

  success(title: string, description?: string) {
    this.createToast('success', title, description);
  }

  error(title: string, description?: string) {
    this.createToast('error', title, description);
  }

  warning(title: string, description?: string) {
    this.createToast('warning', title, description);
  }

  info(title: string, description?: string) {
    this.createToast('info', title, description);
  }
}

// Instância singleton
export const toast = new ToastManager();
