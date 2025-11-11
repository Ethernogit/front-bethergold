import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ComponentCardComponent } from '../../common/component-card/component-card.component';
import { Permission, Role } from '../../../interfaces/auth.interfaces';

@Component({
  selector: 'app-roles-list',
  imports: [
    CommonModule,
    FormsModule,
    ComponentCardComponent,
  ],
  template: `
    <app-component-card title="Lista de Roles" desc="Gestionar roles del sistema">
      <div class="space-y-4">
        <!-- Filtros y búsqueda -->
        <div class="flex flex-col sm:flex-row gap-4 mb-6">
          <div class="flex-1">
            <input
              type="text"
              placeholder="Buscar roles..."
              [(ngModel)]="searchTerm"
              (input)="onSearch()"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <div class="flex gap-2">
            <select
              [(ngModel)]="filterStatus"
              (change)="onFilter()"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
            <button
              (click)="onNewRole()"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              + Nuevo Rol
            </button>
          </div>
        </div>

        <!-- Lista de roles -->
        @if (isLoading) {
          <div class="flex justify-center items-center py-8">
            <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        } @else if (filteredRoles.length === 0) {
          <div class="text-center py-8">
            <div class="text-gray-500 dark:text-gray-400">
              <svg class="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              <p class="text-lg font-medium">No se encontraron roles</p>
              <p class="text-sm mt-1">Crea tu primer rol para comenzar</p>
            </div>
          </div>
        } @else {
          <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            @for (role of filteredRoles; track role.id) {
              <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-200">
                <div class="flex items-start justify-between mb-4">
                  <div class="flex-1">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {{ role.name }}
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                      {{ role.description }}
                    </p>
                  </div>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-3"
                        [ngClass]="role.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'">
                    {{ role.isActive ? 'Activo' : 'Inactivo' }}
                  </span>
                </div>

                <div class="mb-4">
                  <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Permisos ({{ role.permissions.length }})
                  </h4>
                  @if (role.permissions.length > 0) {
                    <div class="flex flex-wrap gap-1">
                      @for (permissionId of role.permissions.slice(0, 3); track permissionId) {
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {{ getPermissionName(permissionId) }}
                        </span>
                      }
                      @if (role.permissions.length > 3) {
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
                          +{{ role.permissions.length - 3 }} más
                        </span>
                      }
                    </div>
                  } @else {
                    <p class="text-xs text-gray-500 dark:text-gray-400">Sin permisos asignados</p>
                  }
                </div>

                <div class="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div class="flex space-x-2">
                    <button
                      (click)="onEditRole(role)"
                      class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded"
                      title="Editar"
                    >
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      (click)="onToggleRole(role)"
                      [class]="role.isActive ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300' : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'"
                      [title]="role.isActive ? 'Desactivar' : 'Activar'"
                      class="p-1 rounded"
                    >
                      @if (role.isActive) {
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                        </svg>
                      } @else {
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      }
                    </button>
                    <button
                      (click)="onDeleteRole(role)"
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"
                      title="Eliminar"
                    >
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  
                  @if (role.createdAt) {
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      {{ formatDate(role.createdAt) }}
                    </span>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </app-component-card>
  `,
  styles: ``
})
export class RolesListComponent {
  @Input() roles: Role[] = [];
  @Input() availablePermissions: Permission[] = [];
  @Input() isLoading = false;
  @Output() newRole = new EventEmitter<void>();
  @Output() editRole = new EventEmitter<Role>();
  @Output() toggleRole = new EventEmitter<Role>();
  @Output() deleteRole = new EventEmitter<Role>();

  searchTerm = '';
  filterStatus = '';
  filteredRoles: Role[] = [];

  ngOnInit() {
    this.filteredRoles = [...this.roles];
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
    let filtered = [...this.roles];

    // Filtrar por término de búsqueda
    if (this.searchTerm.trim()) {
      filtered = filtered.filter(role =>
        role.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        role.description.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Filtrar por estado
    if (this.filterStatus) {
      filtered = filtered.filter(role => {
        if (this.filterStatus === 'active') return role.isActive;
        if (this.filterStatus === 'inactive') return !role.isActive;
        return true;
      });
    }

    this.filteredRoles = filtered;
  }

  onNewRole() {
    this.newRole.emit();
  }

  onEditRole(role: Role) {
    this.editRole.emit(role);
  }

  onToggleRole(role: Role) {
    this.toggleRole.emit(role);
  }

  onDeleteRole(role: Role) {
    this.deleteRole.emit(role);
  }

  getPermissionName(permissionId: string | Permission): string {
    if (typeof permissionId === 'string') {
      const permission = this.availablePermissions.find(p => p.id === permissionId);
      return permission ? permission.name : permissionId;
    } else {
      return permissionId.name;
    }
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  }
}