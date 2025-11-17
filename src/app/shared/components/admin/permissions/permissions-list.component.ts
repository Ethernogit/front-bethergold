import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ComponentCardComponent } from '../../common/component-card/component-card.component';
import { Permission } from '../../../interfaces/auth.interfaces';

@Component({
  selector: 'app-permissions-list',
  imports: [
    CommonModule,
    FormsModule,
    ComponentCardComponent,
  ],
  template: `
    <app-component-card title="Lista de Permisos" desc="Gestionar permisos del sistema">
      <div class="space-y-4">
        <!-- Filtros y búsqueda -->
        <div class="flex flex-col sm:flex-row gap-4 mb-6">
          <div class="flex-1">
            <input
              type="text"
              placeholder="Buscar permisos..."
              [(ngModel)]="searchTerm"
              (input)="onSearch()"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <div class="flex gap-2">
            <select
              [(ngModel)]="filterModule"
              (change)="onFilter()"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Todos los módulos</option>
              @for (module of availableModules; track module) {
                <option [value]="module">{{ getModuleLabel(module) }}</option>
              }
            </select>
            <button
              (click)="onNewPermission()"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              + Nuevo Permiso
            </button>
          </div>
        </div>

        <!-- Tabla de permisos -->
        @if (isLoading) {
          <div class="flex justify-center items-center py-8">
            <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        } @else if (filteredPermissions.length === 0) {
          <div class="text-center py-8">
            <div class="text-gray-500 dark:text-gray-400">
              <svg class="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m0 0V9a2 2 0 012-2h2m0 0V6a2 2 0 012-2h2"></path>
              </svg>
              <p class="text-lg font-medium">No se encontraron permisos</p>
              <p class="text-sm mt-1">Crea tu primer permiso para comenzar</p>
            </div>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Módulo
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acción
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                @for (permission of filteredPermissions; track permission.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ permission.name }}
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate">
                        {{ permission.description }}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            [ngClass]="getModuleBadgeClass(permission.module)">
                        {{ getModuleLabel(permission.module) }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            [ngClass]="getActionBadgeClass(permission.action)">
                        {{ getActionLabel(permission.action) }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            [ngClass]="permission.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'">
                        {{ permission.isActive ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div class="flex space-x-2">
                        <button
                          (click)="onEditPermission(permission)"
                          class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Editar"
                        >
                          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          (click)="onTogglePermission(permission)"
                          [class]="permission.isActive ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300' : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'"
                          [title]="permission.isActive ? 'Desactivar' : 'Activar'"
                        >
                          @if (permission.isActive) {
                            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                            </svg>
                          } @else {
                            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          }
                        </button>
                        <button
                          (click)="onDeletePermission(permission)"
                          class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Eliminar"
                        >
                          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </app-component-card>
  `,
  styles: ``
})
export class PermissionsListComponent {
  @Input() permissions: Permission[] = [];
  @Input() availableModules: string[] = [];
  @Input() isLoading = false;
  @Output() newPermission = new EventEmitter<void>();
  @Output() editPermission = new EventEmitter<Permission>();
  @Output() togglePermission = new EventEmitter<Permission>();
  @Output() deletePermission = new EventEmitter<Permission>();

  searchTerm = '';
  filterModule = '';
  filteredPermissions: Permission[] = [];

  ngOnInit() {
    this.filteredPermissions = [...this.permissions];
  }

  ngOnChanges() {
    this.applyFilters();
  }

  onSearch() {
    this.applyFilters();
  }

  onFilter() {
    this.applyFilters();
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

    this.filteredPermissions = filtered;
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