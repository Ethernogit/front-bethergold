import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal, computed, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Permission } from '../../../interfaces/auth.interfaces';

@Component({
  selector: 'app-permissions-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col gap-4 h-full">
      <div class="rounded-2xl border border-[#E8D9A0] bg-white shadow-theme-sm dark:border-[#4A474D] dark:bg-[#232126] flex flex-col h-full min-h-0">

        <!-- Header -->
        <div class="border-b border-[#E8D9A0] px-4 py-3 dark:border-[#4A474D] sm:px-6 shrink-0">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h1 class="font-instrument text-title-sm font-semibold text-[#191817] dark:text-[#E8C97A]">
                Gestión de Permisos
              </h1>
              <p class="mt-0.5 font-instrument text-theme-sm text-[#6B6560] dark:text-gray-500 hidden sm:block">
                Administra los permisos disponibles en el sistema.
              </p>
            </div>
            <button type="button" (click)="onNewPermission()"
              class="flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#C69214] to-[#FAC600] px-3 py-2.5 sm:px-5 font-instrument text-sm font-semibold text-[#191817] dark:text-white shadow-theme-sm transition-all hover:from-[#9A6F0A] hover:to-[#C69214] hover:shadow-theme-md active:scale-[0.98] shrink-0">
              <svg class="fill-current" width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 4.5V15.5M4.5 10H15.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
              <span class="hidden sm:inline">Nuevo Permiso</span>
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div class="border-b border-[#E8D9A0] px-4 py-3 dark:border-[#4A474D] sm:px-6 shrink-0">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div class="flex-1 relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6560] dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" [(ngModel)]="searchTerm" (input)="onSearch()"
                class="w-full rounded-xl border border-[#E8D9A0] bg-white pl-9 pr-4 py-2 font-instrument text-theme-sm text-[#191817] placeholder-[#6B6560] outline-none transition-all focus:border-[#C69214] focus:ring-2 focus:ring-[#C69214]/20 dark:border-[#4A474D] dark:bg-[#3a383d] dark:text-white dark:placeholder-white/40"
                placeholder="Buscar permisos...">
            </div>
            <select [(ngModel)]="filterModule" (change)="onFilter()"
              class="w-full sm:w-48 rounded-xl border border-[#E8D9A0] bg-white px-3 py-2 font-instrument text-theme-sm text-[#191817] outline-none transition-all focus:border-[#C69214] focus:ring-2 focus:ring-[#C69214]/20 dark:border-[#4A474D] dark:bg-[#3a383d] dark:text-white">
              <option value="">Todos los módulos</option>
              @for (module of availableModules; track module) {
              <option [value]="module">{{ getModuleLabel(module) }}</option>
              }
            </select>
          </div>
        </div>

        <!-- Loading -->
        @if (isLoading) {
        <div class="flex-1 flex justify-center items-center py-12">
          <div class="h-10 w-10 animate-spin rounded-full border-4 border-solid border-[#C69214] border-t-transparent"></div>
        </div>
        }

        <!-- Content -->
        @if (!isLoading) {
        <div class="flex-1 overflow-auto min-h-0">

          @if (paginatedPermissions().length === 0) {
          <div class="flex flex-col items-center justify-center gap-3 py-16 px-6">
            <div class="flex size-16 items-center justify-center rounded-full bg-[#FBF0C9] dark:bg-[#4A474D]">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-[#C69214]">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <p class="font-instrument text-theme-sm text-[#6B6560] dark:text-gray-400">No hay permisos registrados</p>
            <button (click)="onNewPermission()"
              class="flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#C69214] to-[#FAC600] px-4 py-2 font-instrument text-sm font-semibold text-[#191817] dark:text-white shadow-theme-sm transition-all hover:from-[#9A6F0A] hover:to-[#C69214] active:scale-[0.98]">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 4.5V15.5M4.5 10H15.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
              Crear Permiso
            </button>
          </div>
          }

          @if (paginatedPermissions().length > 0) {
          <!-- Mobile cards -->
          <div class="sm:hidden divide-y divide-[#E8D9A0] dark:divide-[#4A474D]">
            @for (permission of paginatedPermissions(); track permission.id) {
            <div class="p-4">
              <div class="flex items-start justify-between gap-2 mb-1.5">
                <p class="font-instrument text-theme-sm font-semibold text-[#191817] dark:text-white truncate">{{permission.name}}</p>
                <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-instrument text-theme-xs font-medium shrink-0"
                  [ngClass]="permission.isActive
                    ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400'
                    : 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400'">
                  <span class="size-1.5 rounded-full" [ngClass]="permission.isActive ? 'bg-success-500' : 'bg-error-500'"></span>
                  {{permission.isActive ? 'Activo' : 'Inactivo'}}
                </span>
              </div>
              <p class="font-instrument text-theme-xs text-[#6B6560] dark:text-gray-400 truncate mb-2">{{permission.description}}</p>
              <div class="flex items-center gap-2 mb-3">
                <span class="inline-flex items-center rounded-md px-2 py-0.5 font-instrument text-[10px] font-medium"
                  [ngClass]="getModuleBadgeClass(permission.module)">
                  {{getModuleLabel(permission.module)}}
                </span>
                <span class="inline-flex items-center rounded-md px-2 py-0.5 font-instrument text-[10px] font-medium"
                  [ngClass]="getActionBadgeClass(permission.action)">
                  {{getActionLabel(permission.action)}}
                </span>
              </div>
              <div class="flex items-center gap-1">
                <button (click)="onEditPermission(permission)"
                  class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-instrument text-theme-xs font-medium text-[#46424A] hover:bg-[#FBF0C9] hover:text-[#C69214] dark:text-gray-400 dark:hover:bg-[#4A474D] dark:hover:text-[#FAC600] transition-colors border border-[#E8D9A0] dark:border-[#4A474D]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Editar
                </button>
                <button (click)="onTogglePermission(permission)"
                  class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-instrument text-theme-xs font-medium transition-colors border"
                  [ngClass]="permission.isActive
                    ? 'text-[#46424A] hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 border-[#E8D9A0] dark:border-[#4A474D]'
                    : 'text-success-700 hover:bg-success-50 dark:text-success-400 dark:hover:bg-success-500/10 border-success-200 dark:border-success-500/30'">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="1" y="5" width="22" height="14" rx="7" ry="7"></rect>
                    <circle [attr.cx]="permission.isActive ? '15' : '9'" cy="12" r="3" fill="currentColor"></circle>
                  </svg>
                  {{permission.isActive ? 'Desactivar' : 'Activar'}}
                </button>
                <button (click)="onDeletePermission(permission)"
                  class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-instrument text-theme-xs font-medium text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10 transition-colors border border-error-200 dark:border-error-500/30">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                  </svg>
                  Eliminar
                </button>
              </div>
            </div>
            }
          </div>

          <!-- Desktop table -->
          <table class="hidden sm:table min-w-full divide-y divide-[#E8D9A0] dark:divide-[#4A474D]">
            <thead class="bg-[#FBF0C9] dark:bg-[#232126] sticky top-0 z-10">
              <tr class="text-left font-instrument text-theme-xs font-semibold uppercase tracking-wider text-[#9A6F0A] dark:text-[#E8C97A]">
                <th class="px-6 py-3">Nombre</th>
                <th class="px-6 py-3">Descripción</th>
                <th class="px-6 py-3">Módulo</th>
                <th class="px-6 py-3">Acción</th>
                <th class="px-6 py-3">Estado</th>
                <th class="px-6 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E8D9A0] bg-white dark:divide-[#4A474D] dark:bg-[#232126]">
              @for (permission of paginatedPermissions(); track permission.id) {
              <tr class="hover:bg-[#FBF0C9]/40 dark:hover:bg-white/5 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap font-instrument text-theme-sm font-semibold text-[#191817] dark:text-white">
                  {{permission.name}}
                </td>
                <td class="px-6 py-4 font-instrument text-theme-sm text-[#46424A] dark:text-gray-300">
                  <p class="truncate max-w-xs" [title]="permission.description">{{permission.description}}</p>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center rounded-md px-2.5 py-0.5 font-instrument text-theme-xs font-medium"
                    [ngClass]="getModuleBadgeClass(permission.module)">
                    {{getModuleLabel(permission.module)}}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center rounded-md px-2.5 py-0.5 font-instrument text-theme-xs font-medium"
                    [ngClass]="getActionBadgeClass(permission.action)">
                    {{getActionLabel(permission.action)}}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-instrument text-theme-xs font-medium"
                    [ngClass]="permission.isActive
                      ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400'
                      : 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400'">
                    <span class="size-1.5 rounded-full" [ngClass]="permission.isActive ? 'bg-success-500' : 'bg-error-500'"></span>
                    {{permission.isActive ? 'Activo' : 'Inactivo'}}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center justify-center gap-1">
                    <button (click)="onEditPermission(permission)"
                      class="rounded-lg p-2 text-[#6B6560] hover:bg-[#FBF0C9] hover:text-[#C69214] dark:text-gray-400 dark:hover:bg-[#4A474D] dark:hover:text-[#FAC600] transition-colors"
                      title="Editar">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button (click)="onTogglePermission(permission)"
                      class="rounded-lg p-2 transition-colors"
                      [ngClass]="permission.isActive
                        ? 'text-[#6B6560] hover:bg-gray-100 hover:text-[#46424A] dark:text-gray-400 dark:hover:bg-white/5'
                        : 'text-success-600 hover:bg-success-50 dark:text-success-400 dark:hover:bg-success-500/10'"
                      [title]="permission.isActive ? 'Desactivar' : 'Activar'">
                      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="1" y="5" width="22" height="14" rx="7" ry="7"></rect>
                        <circle [attr.cx]="permission.isActive ? '15' : '9'" cy="12" r="3" fill="currentColor"></circle>
                      </svg>
                    </button>
                    <button (click)="onDeletePermission(permission)"
                      class="rounded-lg p-2 text-[#6B6560] hover:bg-error-50 hover:text-error-600 dark:text-gray-400 dark:hover:bg-error-500/10 dark:hover:text-error-400 transition-colors"
                      title="Eliminar">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
              }
            </tbody>
          </table>
          }
        </div>
        }

        <!-- Pagination -->
        <div class="border-t border-[#E8D9A0] px-4 py-3 dark:border-[#4A474D] sm:px-6 shrink-0 bg-white dark:bg-[#232126] rounded-b-2xl">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <span class="font-instrument text-theme-sm text-[#46424A] dark:text-gray-400 hidden xsm:inline">Mostrar</span>
              <select [ngModel]="itemsPerPage()" (ngModelChange)="onLimitChange($event)"
                class="rounded-xl border border-[#E8D9A0] bg-white px-3 py-1.5 font-instrument text-theme-sm text-[#191817] outline-none dark:border-[#4A474D] dark:bg-[#3a383d] dark:text-white transition-all focus:border-[#C69214] focus:ring-2 focus:ring-[#C69214]/20">
                <option [value]="10">10</option>
                <option [value]="25">25</option>
                <option [value]="50">50</option>
              </select>
            </div>
            <div class="flex items-center gap-3">
              <p class="font-instrument text-theme-sm text-[#46424A] dark:text-gray-300">
                <span class="font-medium">{{currentPage()}}/{{totalPages() || 1}}</span>
                <span class="hidden xsm:inline font-semibold text-[#191817] dark:text-white"> ({{filteredPermissionsSignal().length}})</span>
              </p>
              <div class="flex items-center gap-1">
                <button (click)="onPageChange(currentPage() - 1)" [disabled]="currentPage() === 1"
                  class="flex items-center justify-center rounded-xl p-2 text-[#46424A] hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  <svg class="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M12.7071 5.29289C13.0976 5.68342 13.0976 6.31658 12.7071 6.70711L9.41421 10L12.7071 13.2929C13.0976 13.6834 13.0976 14.3166 12.7071 14.7071C12.3166 15.0976 11.6834 15.0976 11.2929 14.7071L7.29289 10.7071C6.90237 10.3166 6.90237 9.68342 7.29289 9.29289L11.2929 5.29289C11.6834 4.90237 12.3166 4.90237 12.7071 5.29289Z" />
                  </svg>
                </button>
                <button (click)="onPageChange(currentPage() + 1)" [disabled]="currentPage() >= totalPages()"
                  class="flex items-center justify-center rounded-xl p-2 text-[#46424A] hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  <svg class="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M7.29289 14.7071C6.90237 14.3166 6.90237 13.6834 7.29289 13.2929L10.5858 10L7.29289 6.70711C6.90237 6.31658 6.90237 5.68342 7.29289 5.29289C7.68342 4.90237 8.31658 4.90237 8.70711 5.29289L12.7071 9.29289C13.0976 9.68342 13.0976 10.3166 12.7071 10.7071L8.70711 14.7071C8.31658 15.0976 7.68342 15.0976 7.29289 14.7071Z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`:host { display: flex; flex-direction: column; height: 100%; }`]
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

  filteredPermissionsSignal = signal<Permission[]>([]);
  currentPage = signal(1);
  itemsPerPage = signal(10);

  paginatedPermissions = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    return this.filteredPermissionsSignal().slice(start, start + this.itemsPerPage());
  });

  totalPages = computed(() => Math.ceil(this.filteredPermissionsSignal().length / this.itemsPerPage()));

  ngOnChanges(changes: SimpleChanges) {
    if (changes['permissions']) this.applyFilters();
  }

  onSearch() { this.currentPage.set(1); this.applyFilters(); }
  onFilter() { this.currentPage.set(1); this.applyFilters(); }
  onPageChange(page: number) { this.currentPage.set(page); }
  onLimitChange(limit: number) { this.itemsPerPage.set(limit); this.currentPage.set(1); }

  private applyFilters() {
    let filtered = [...this.permissions];
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)
      );
    }
    if (this.filterModule) {
      filtered = filtered.filter(p => p.module === this.filterModule);
    }
    this.filteredPermissionsSignal.set(filtered);
  }

  onNewPermission() { this.newPermission.emit(); }
  onEditPermission(p: Permission) { this.editPermission.emit(p); }
  onTogglePermission(p: Permission) { this.togglePermission.emit(p); }
  onDeletePermission(p: Permission) { this.deletePermission.emit(p); }

  getModuleLabel(module: string): string {
    const labels: Record<string, string> = {
      users: 'Usuarios', roles: 'Roles', permissions: 'Permisos', tenants: 'Tenants',
      products: 'Productos', orders: 'Órdenes', inventory: 'Inventario', sales: 'Ventas',
      reports: 'Reportes', settings: 'Configuraciones', analytics: 'Analíticas',
      notifications: 'Notificaciones', payments: 'Pagos', customers: 'Clientes',
      suppliers: 'Proveedores', invitations: 'Invitaciones', organization: 'Organización',
      categories: 'Categorías', subcategories: 'Subcategorías', sucursales: 'Sucursales',
      auth: 'Autenticación', provider: 'Proveedores', admin: 'Administración'
    };
    return labels[module] || module.charAt(0).toUpperCase() + module.slice(1);
  }

  getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      create: 'Crear', read: 'Leer', update: 'Actualizar',
      delete: 'Eliminar', list: 'Listar', export: 'Exportar', import: 'Importar'
    };
    return labels[action] || action;
  }

  getModuleBadgeClass(module: string): string {
    const classes: Record<string, string> = {
      users: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
      roles: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
      permissions: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
      products: 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400',
      orders: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',
      inventory: 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400',
      sales: 'bg-[#FBF0C9] text-[#9A6F0A] dark:bg-[#4A474D] dark:text-[#E8C97A]',
      reports: 'bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400',
      analytics: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400',
      auth: 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400',
      admin: 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400',
    };
    return classes[module] || 'bg-[#F5F0EC] text-[#46424A] dark:bg-white/5 dark:text-gray-400';
  }

  getActionBadgeClass(action: string): string {
    const classes: Record<string, string> = {
      create: 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400',
      read: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
      update: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
      delete: 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400',
      list: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
      export: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',
      import: 'bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400',
    };
    return classes[action] || 'bg-[#F5F0EC] text-[#46424A] dark:bg-white/5 dark:text-gray-400';
  }
}
