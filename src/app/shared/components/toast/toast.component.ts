import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastType } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-xs sm:max-w-sm pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          class="pointer-events-auto transform transition-all duration-300 ease-out animate-slide-in"
          [ngClass]="{
            'animate-fade-out': false 
          }">
          <div class="flex items-center p-4 rounded-xl shadow-theme-lg border bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 relative overflow-hidden group">
            
            <!-- Left accent border -->
            <div class="absolute left-0 top-0 bottom-0 w-1"
              [ngClass]="getBorderClass(toast.type)">
            </div>

            <!-- Icon -->
            <div class="flex-shrink-0 mr-3">
              @if (toast.type === 'success') {
                <div class="w-8 h-8 rounded-full bg-success-50 dark:bg-success-500/10 flex items-center justify-center text-success-500">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              } @else if (toast.type === 'error') {
                <div class="w-8 h-8 rounded-full bg-error-50 dark:bg-error-500/10 flex items-center justify-center text-error-500">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
              } @else if (toast.type === 'warning') {
                <div class="w-8 h-8 rounded-full bg-warning-50 dark:bg-warning-500/10 flex items-center justify-center text-warning-500">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                </div>
              } @else {
                <div class="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-500">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              }
            </div>

            <!-- Content -->
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-800 dark:text-white">
                {{ getTitle(toast.type) }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {{ toast.message }}
              </p>
            </div>

            <!-- Close button -->
            <button 
              (click)="toastService.remove(toast.id)"
              class="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .animate-slide-in {
      animation: slideIn 0.3s ease-out forwards;
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);

  getBorderClass(type: ToastType): string {
    switch (type) {
      case 'success': return 'bg-success-500';
      case 'error': return 'bg-error-500';
      case 'warning': return 'bg-warning-500';
      default: return 'bg-brand-500';
    }
  }

  getTitle(type: ToastType): string {
    switch (type) {
      case 'success': return 'Éxito';
      case 'error': return 'Error';
      case 'warning': return 'Advertencia';
      case 'info': return 'Información';
    }
  }
}
