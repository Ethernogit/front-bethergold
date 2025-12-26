import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-sales-history',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Historial de Ventas</h2>
      <p class="text-gray-500 dark:text-gray-400">Próximamente: Lista de todas las ventas realizadas.</p>
    </div>
  `
})
export class SalesHistoryComponent { }
