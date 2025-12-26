import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal, computed, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Permission } from '../../../interfaces/auth.interfaces';

@Component({
  selector: 'app-permissions-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  template: `
    <!-- Permissions List Component -->
    <div class="mx-auto max-w-screen-2xl h-[calc(100vh-50px)] flex flex-col overflow-hidden">
      <div class="flex flex-col gap-4 h-full">
        <div
          class="rounded-sm border border-stroke bg-white shadow-default dark:border-gray-800 dark:bg-gray-900 flex flex-col h-full">
          <!-- Header -->
          <div class="border-b border-stroke px-4 py-3 dark:border-gray-800 sm:px-6 shrink-0">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 class="font-medium text-black dark:text-white">
                Lista de Permisos
              </h3>
              <button type="button" (click)="onNewPermission()"
                class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-center font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all duration-200">
                <svg class="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 4.5V15.5M4.5 10H15.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
                Nuevo Permiso
              </button>
            </div>
          </div>

          <!-- Filters -->
          <div class="border-b border-stroke px-4 py-3 dark:border-gray-800 shrink-0">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div class="flex-1">
                <label class="mb-2.5 block text-sm font-medium text-black dark:text-white">
                  Buscar
                </label>
                <input type="text" [(ngModel)]="searchTerm" (input)="onSearch()"
                  class="w-full rounded-lg border border-gray-300 bg-gray-50 px-5 py-2.5 font-medium outline-none transition focus:border-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-brand-500 dark:focus:ring-brand-500"
                  placeholder="Buscar permisos...">
              </div>

              <div class="w-full sm:w-48">
                <label class="mb-2.5 block text-sm font-medium text-black dark:text-white">
                  Módulo
                </label>
                <select [(ngModel)]="filterModule" (change)="onFilter()"
                  class="w-full rounded-lg border border-gray-300 bg-gray-50 px-5 py-2.5 font-medium outline-none transition focus:border-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-brand-500 dark:focus:ring-brand-500">
                  <option value="">Todos los módulos</option>
                  @for (module of availableModules; track module) {
                  <option [value]="module">{{ getModuleLabel(module) }}</option>
                  }
                </select>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          @if (isLoading) {
          <div class="flex justify-center py-10">
            <div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent">
            </div>
          </div>
          }

          <!-- Table -->
          @if (!isLoading) {
          <div class="flex-1 overflow-y-auto p-0 z-0">
            @if (paginatedPermissions().length > 0) {
            <div class="relative">
              <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                <thead
                  class="sticky top-0 z-10 bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-400 shadow-sm">
                  <tr>
                    <th class="px-6 py-4 font-medium">Nombre</th>
                    <th class="px-6 py-4 font-medium">Descripción</th>
                    <th class="px-6 py-4 font-medium">Módulo</th>
                    <th class="px-6 py-4 font-medium">Acción</th>
                    <th class="px-6 py-4 font-medium">Estado</th>
                    <th class="px-6 py-4 font-medium text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  @for (permission of paginatedPermissions(); track permission.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td class="px-6 py-4 font-medium text-black dark:text-white">
                      {{ permission.name }}
                    </td>
                    <td class="px-6 py-4">
                      <p class="truncate max-w-xs" title="{{ permission.description }}">{{ permission.description }}</p>
                    </td>
                    <td class="px-6 py-4">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        [ngClass]="getModuleBadgeClass(permission.module)">
                        {{ getModuleLabel(permission.module) }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        [ngClass]="getActionBadgeClass(permission.action)">
                        {{ getActionLabel(permission.action) }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <span class="inline-flex rounded-full px-3 py-1 text-xs font-medium" [ngClass]="{
                                          'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400': permission.isActive,
                                          'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400': !permission.isActive
                                        }">
                        {{ permission.isActive ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-center">
                      <div class="flex items-center justify-center gap-2">
                        <button (click)="onEditPermission(permission)"
                          class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-blue-400 transition-colors"
                          title="Editar">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button (click)="onTogglePermission(permission)"
                          class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-yellow-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-yellow-400 transition-colors"
                          [title]="permission.isActive ? 'Desactivar' : 'Activar'">
                          <i class="fas" [ngClass]="permission.isActive ? 'fa-toggle-on' : 'fa-toggle-off'"></i>
                        </button>
                        <button (click)="onDeletePermission(permission)"
                          class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-red-400 transition-colors"
                          title="Eliminar">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                  }
                </tbody>
              </table>
            </div>
            } @else {
            <div class="flex flex-col items-center justify-center py-12 text-center">
              <div class="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-800">
                <i class="fas fa-shield-alt text-3xl text-gray-400"></i>
              </div>
              <h5 class="mb-2 text-lg font-medium text-gray-900 dark:text-white">No hay permisos registrados</h5>
              <button (click)="onNewPermission()"
                class="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all">
                <svg class="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 4.5V15.5M4.5 10H15.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
                <span>Crear Permiso</span>
              </button>
            </div>
            }
          </div>
          }

          <!-- Pagination Controls -->
          <div
            class="border-t border-stroke px-4 py-3 dark:border-gray-800 sm:px-6 shrink-0 bg-white dark:bg-gray-900 rounded-b-sm">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium text-black dark:text-white">Items por página:</p>
                <select [ngModel]="itemsPerPage()" (ngModelChange)="onLimitChange($event)"
                  class="rounded border border-stroke bg-transparent px-2 py-1 outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white transition focus:border-brand-500 active:border-brand-500">
                  <option [value]="10" class="dark:bg-gray-700 dark:text-white">10</option>
                  <option [value]="25" class="dark:bg-gray-700 dark:text-white">25</option>
                  <option [value]="50" class="dark:bg-gray-700 dark:text-white">50</option>
                  <option [value]="100" class="dark:bg-gray-700 dark:text-white">100</option>
                </select>
              </div>

              <div class="flex items-center gap-4">
                <p class="text-sm font-medium text-black dark:text-white">
                  Página {{ currentPage() }} de {{ totalPages() || 1 }}
                </p>
                <div class="flex items-center gap-2">
                  <button (click)="onPageChange(currentPage() - 1)" [disabled]="currentPage() === 1"
                    class="flex items-center justify-center rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition">
                    <svg class="fill-current text-black dark:text-white" width="20" height="20" viewBox="0 0 20 20"
                      fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fill-rule="evenodd" clip-rule="evenodd"
                        d="M12.7071 5.29289C13.0976 5.68342 13.0976 6.31658 12.7071 6.70711L9.41421 10L12.7071 13.2929C13.0976 13.6834 13.0976 14.3166 12.7071 14.7071C12.3166 15.0976 11.6834 15.0976 11.2929 14.7071L7.29289 10.7071C6.90237 10.3166 6.90237 9.68342 7.29289 9.29289L11.2929 5.29289C11.6834 4.90237 12.3166 4.90237 12.7071 5.29289Z" />
                    </svg>
                  </button>
                  <button (click)="onPageChange(currentPage() + 1)" [disabled]="currentPage() >= totalPages()"
                    class="flex items-center justify-center rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition">
                    <svg class="fill-current text-black dark:text-white" width="20" height="20" viewBox="0 0 20 20"
                      fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fill-rule="evenodd" clip-rule="evenodd"
                        d="M7.29289 14.7071C6.90237 14.3166 6.90237 13.6834 7.29289 13.2929L10.5858 10L7.29289 6.70711C6.90237 6.31658 6.90237 5.68342 7.29289 5.29289C7.68342 4.90237 8.31658 4.90237 8.70711 5.29289L12.7071 9.29289C13.0976 9.68342 13.0976 10.3166 12.7071 10.7071L8.70711 14.7071C8.31658 15.0976 7.68342 15.0976 7.29289 14.7071Z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: ``
})
export class PermissionsListComponent implements OnChanges {
  @Input() permissions: Permission[] = [];
  @Input() availableModules: string[] = [];
  @Input() isLoading = false;
  @Output() newPermission = new EventEmitter<void>();
  @Output() editPermission = new EventEmitter<Permission>();
  @Output() togglePermission = new EventEmitter<Permission>();
  @Output() deletePermission = new EventEmitter<Permission>();

  searchTerm = '';
  filterModule = '';

  // Use a signal for the filtered list to easily derive pagination
  filteredPermissionsSignal = signal<Permission[]>([]);

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(10);

  paginatedPermissions = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
    const endIndex = startIndex + this.itemsPerPage();
    return this.filteredPermissionsSignal().slice(startIndex, endIndex);
  });

  totalPages = computed(() => Math.ceil(this.filteredPermissionsSignal().length / this.itemsPerPage()));

  ngOnChanges(changes: SimpleChanges) {
    if (changes['permissions']) {
      this.applyFilters();
    }
  }

  onSearch() {
    this.currentPage.set(1);
    this.applyFilters();
  }

  onFilter() {
    this.currentPage.set(1);
    this.applyFilters();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
  }

  onLimitChange(limit: number) {
    this.itemsPerPage.set(limit);
    this.currentPage.set(1);
  }

  private applyFilters() {
    let filtered = [...this.permissions];

    // Filtrar por término de búsqueda
    if (this.searchTerm.trim()) {
      filtered = filtered.filter(permission =>
        permission.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        permission.description.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Filtrar por módulo
    if (this.filterModule) {
      filtered = filtered.filter(permission => permission.module === this.filterModule);
    }

    this.filteredPermissionsSignal.set(filtered);
  }

  onNewPermission() {
    this.newPermission.emit();
  }

  onEditPermission(permission: Permission) {
    this.editPermission.emit(permission);
  }

  onTogglePermission(permission: Permission) {
    this.togglePermission.emit(permission);
  }

  onDeletePermission(permission: Permission) {
    this.deletePermission.emit(permission);
  }

  getModuleLabel(module: string): string {
    const labels: { [key: string]: string } = {
      'users': 'Usuarios',
      'roles': 'Roles',
      'permissions': 'Permisos',
      'tenants': 'Tenants',
      'products': 'Productos',
      'orders': 'Órdenes',
      'inventory': 'Inventario',
      'sales': 'Ventas',
      'reports': 'Reportes',
      'settings': 'Configuraciones',
      'analytics': 'Analíticas',
      'notifications': 'Notificaciones',
      'payments': 'Pagos',
      'customers': 'Clientes',
      'suppliers': 'Proveedores',
      'invitations': 'Invitaciones',
      'organization': 'Organización',
      'categories': 'Categorías',
      'subcategories': 'Subcategorías',
      'sucursales': 'Sucursales',
      'auth': 'Autenticación',
      'provider': 'Proveedores',
      'admin': 'Administración'
    };
    return labels[module] || module.charAt(0).toUpperCase() + module.slice(1);
  }

  getActionLabel(action: string): string {
    const labels: { [key: string]: string } = {
      'create': 'Crear',
      'read': 'Leer',
      'update': 'Actualizar',
      'delete': 'Eliminar',
      'list': 'Listar',
      'export': 'Exportar',
      'import': 'Importar'
    };
    return labels[action] || action;
  }

  getModuleBadgeClass(module: string): string {
    const classes: { [key: string]: string } = {
      'users': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'roles': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'permissions': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'products': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'orders': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'inventory': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
      'sales': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
      'reports': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      'analytics': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
      'notifications': 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300',
      'organization': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      'categories': 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300',
      'auth': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'provider': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'admin': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return classes[module] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }

  getActionBadgeClass(action: string): string {
    const classes: { [key: string]: string } = {
      'create': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'read': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'update': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'delete': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'list': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'export': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      'import': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300'
    };
    return classes[action] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
}