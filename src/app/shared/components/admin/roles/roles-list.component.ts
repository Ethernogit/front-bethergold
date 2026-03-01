import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal, computed, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Permission, Role } from '../../../interfaces/auth.interfaces';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  template: `
    <!-- Roles List Component -->
    <div class="mx-auto max-w-screen-2xl h-[calc(100vh-50px)] flex flex-col overflow-hidden">
      <div class="flex flex-col gap-4 h-full">
        <div
          class="rounded-sm border border-stroke bg-white shadow-default dark:border-gray-800 dark:bg-[#3a383d] flex flex-col h-full">
          <!-- Header -->
          <div class="border-b border-stroke px-4 py-3 dark:border-gray-800 sm:px-6 shrink-0">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 class="font-medium text-black dark:text-white">
                Lista de Roles
              </h3>
              <button type="button" (click)="onNewRole()"
                class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-center font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all duration-200">
                <svg class="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 4.5V15.5M4.5 10H15.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
                Nuevo Rol
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
                  placeholder="Buscar roles...">
              </div>
    
              <div class="w-full sm:w-48">
                <label class="mb-2.5 block text-sm font-medium text-black dark:text-white">
                  Estado
                </label>
                <select [(ngModel)]="filterStatus" (change)="onFilter()"
                  class="w-full rounded-lg border border-gray-300 bg-gray-50 px-5 py-2.5 font-medium outline-none transition focus:border-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-brand-500 dark:focus:ring-brand-500">
                  <option value="">Todos</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
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
            @if (paginatedRoles().length > 0) {
            <div class="relative">
              <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                <thead
                  class="sticky top-0 z-10 bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-400 shadow-sm">
                  <tr>
                    <th class="px-6 py-4 font-medium">Nombre</th>
                    <th class="px-6 py-4 font-medium">Descripción</th>
                    <th class="px-6 py-4 font-medium">Permisos</th>
                    <th class="px-6 py-4 font-medium">Estado</th>
                    <th class="px-6 py-4 font-medium">Alcance</th>
                    <th class="px-6 py-4 font-medium text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  @for (role of paginatedRoles(); track role.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td class="px-6 py-4 font-medium text-black dark:text-white">
                      {{ role.name }}
                    </td>
                    <td class="px-6 py-4">
                      <p class="truncate max-w-xs" title="{{ role.description }}">{{ role.description }}</p>
                    </td>
                    <td class="px-6 py-4">
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {{ role.permissions.length }} permisos
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <span class="inline-flex rounded-full px-3 py-1 text-xs font-medium" [ngClass]="{
                                          'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400': role.isActive,
                                          'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400': !role.isActive
                                        }">
                        {{ role.isActive ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <span class="inline-flex rounded-full px-3 py-1 text-xs font-medium" [ngClass]="{
                                          'bg-purple-100 text-purple-800 dark:bg-purple-800/30 dark:text-purple-400': !role.sucursalId,
                                          'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400': role.sucursalId
                                        }">
                        {{ !role.sucursalId ? 'Global' : 'Local' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-center">
                      <div class="flex items-center justify-center gap-2">
                        <button (click)="onEditRole(role)"
                          class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-blue-400 transition-colors"
                          title="Editar">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button (click)="onToggleRole(role)"
                          class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-yellow-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-yellow-400 transition-colors"
                          [title]="role.isActive ? 'Desactivar' : 'Activar'">
                          <i class="fas" [ngClass]="role.isActive ? 'fa-toggle-on' : 'fa-toggle-off'"></i>
                        </button>
                        <button (click)="onDeleteRole(role)"
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
              <h5 class="mb-2 text-lg font-medium text-gray-900 dark:text-white">No hay roles registrados</h5>
              <button (click)="onNewRole()"
                class="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all">
                <svg class="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 4.5V15.5M4.5 10H15.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
                <span>Crear Rol</span>
              </button>
            </div>
            }
          </div>
          }
    
          <!-- Pagination Controls -->
          <div
            class="border-t border-stroke px-4 py-3 dark:border-gray-800 sm:px-6 shrink-0 bg-white dark:bg-[#3a383d] rounded-b-sm">
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
export class RolesListComponent implements OnChanges {
  @Input() roles: Role[] = [];
  @Input() availablePermissions: Permission[] = [];
  @Input() isLoading = false;
  @Output() newRole = new EventEmitter<void>();
  @Output() editRole = new EventEmitter<Role>();
  @Output() toggleRole = new EventEmitter<Role>();
  @Output() deleteRole = new EventEmitter<Role>();

  searchTerm = '';
  filterStatus = '';

  // Use a signal for the filtered list to easily derive pagination
  filteredRolesSignal = signal<Role[]>([]);

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(10);

  paginatedRoles = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
    const endIndex = startIndex + this.itemsPerPage();
    return this.filteredRolesSignal().slice(startIndex, endIndex);
  });

  totalPages = computed(() => Math.ceil(this.filteredRolesSignal().length / this.itemsPerPage()));

  ngOnChanges(changes: SimpleChanges) {
    if (changes['roles']) {
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

    this.filteredRolesSignal.set(filtered);
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