import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Permission, Role } from '../../../interfaces/auth.interfaces';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Backdrop -->
    <div class="fixed inset-0 z-[9998] bg-[#191817]/60 backdrop-blur-sm" (click)="onCancel()"></div>

    <!-- Panel -->
    <div class="fixed inset-y-0 right-0 z-[9999] flex w-full max-w-lg flex-col bg-white shadow-2xl dark:bg-[#232126] transition-transform duration-300">
      <!-- Panel header -->
      <div class="border-b border-[#E8D9A0] dark:border-[#4A474D] px-5 py-4 shrink-0">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-instrument text-theme-xl font-semibold text-[#191817] dark:text-white">
              {{editMode ? 'Editar Rol' : 'Nuevo Rol'}}
            </h2>
            <p class="font-instrument text-theme-xs text-[#6B6560] dark:text-gray-400 mt-0.5">
              {{editMode ? 'Modifica los datos del rol seleccionado.' : 'Completa los campos para crear un nuevo rol.'}}
            </p>
          </div>
          <button (click)="onCancel()"
            class="p-1.5 rounded-lg text-[#6B6560] hover:text-[#191817] hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Scrollable form body -->
      <div class="flex-1 overflow-y-auto p-5">
        <form [formGroup]="roleForm" (ngSubmit)="onSubmit()" class="space-y-5">

          <!-- Name -->
          <div>
            <label class="mb-1.5 block font-instrument text-theme-sm font-medium text-[#46424A] dark:text-gray-300">
              Nombre del Rol <span class="text-error-500">*</span>
            </label>
            <input type="text" formControlName="name" placeholder="Ej: Administrador, Editor..."
              class="w-full rounded-xl border bg-white px-4 py-2.5 font-instrument text-theme-sm text-[#191817] placeholder-[#6B6560] outline-none transition-all dark:bg-[#3a383d] dark:text-white dark:placeholder-white/40"
              [ngClass]="roleForm.get('name')?.invalid && roleForm.get('name')?.touched
                ? 'border-error-400 focus:border-error-500 focus:ring-2 focus:ring-error-500/20 dark:border-error-500'
                : 'border-[#E8D9A0] focus:border-[#C69214] focus:ring-2 focus:ring-[#C69214]/20 dark:border-[#4A474D]'">
            @if (roleForm.get('name')?.invalid && roleForm.get('name')?.touched) {
            <p class="mt-1 font-instrument text-theme-xs text-error-600 dark:text-error-400">El nombre es requerido (mín. 3 caracteres)</p>
            }
          </div>

          <!-- Description -->
          <div>
            <label class="mb-1.5 block font-instrument text-theme-sm font-medium text-[#46424A] dark:text-gray-300">
              Descripción <span class="text-error-500">*</span>
            </label>
            <textarea formControlName="description" rows="2" placeholder="Descripción detallada del rol..."
              class="w-full rounded-xl border bg-white px-4 py-2.5 font-instrument text-theme-sm text-[#191817] placeholder-[#6B6560] outline-none transition-all resize-none dark:bg-[#3a383d] dark:text-white dark:placeholder-white/40"
              [ngClass]="roleForm.get('description')?.invalid && roleForm.get('description')?.touched
                ? 'border-error-400 focus:border-error-500 focus:ring-2 focus:ring-error-500/20 dark:border-error-500'
                : 'border-[#E8D9A0] focus:border-[#C69214] focus:ring-2 focus:ring-[#C69214]/20 dark:border-[#4A474D]'"></textarea>
            @if (roleForm.get('description')?.invalid && roleForm.get('description')?.touched) {
            <p class="mt-1 font-instrument text-theme-xs text-error-600 dark:text-error-400">La descripción es requerida (mín. 10 caracteres)</p>
            }
          </div>

          <!-- Toggles -->
          <div class="flex flex-col gap-3 rounded-xl border border-[#E8D9A0] dark:border-[#4A474D] p-4 bg-[#FBF0C9]/20 dark:bg-[#3a383d]">
            <label class="flex items-center gap-3 cursor-pointer">
              <div class="relative">
                <input type="checkbox" formControlName="isActive" class="sr-only peer">
                <div class="w-10 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:bg-[#C69214] transition-colors"></div>
                <div class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
              </div>
              <div>
                <p class="font-instrument text-theme-sm font-medium text-[#191817] dark:text-white">Rol Activo</p>
                <p class="font-instrument text-theme-xs text-[#6B6560] dark:text-gray-400">El rol estará disponible para asignar a usuarios</p>
              </div>
            </label>
            <div class="border-t border-[#E8D9A0] dark:border-[#4A474D]"></div>
            <label class="flex items-center gap-3 cursor-pointer">
              <div class="relative">
                <input type="checkbox" formControlName="isGlobal" class="sr-only peer">
                <div class="w-10 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:bg-purple-500 transition-colors"></div>
                <div class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
              </div>
              <div>
                <p class="font-instrument text-theme-sm font-medium text-[#191817] dark:text-white">Rol Global</p>
                <p class="font-instrument text-theme-xs text-[#6B6560] dark:text-gray-400">Disponible en todas las sucursales</p>
              </div>
            </label>
          </div>

          <!-- Permissions -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="font-instrument text-theme-sm font-medium text-[#46424A] dark:text-gray-300">
                Permisos <span class="text-error-500">*</span>
              </label>
              <span class="font-instrument text-theme-xs text-[#9A6F0A] dark:text-[#E8C97A]">
                {{selectedPermissions.length}} seleccionados
              </span>
            </div>

            @if (availablePermissions.length === 0) {
            <div class="rounded-xl border border-[#E8D9A0] dark:border-[#4A474D] p-6 text-center">
              <p class="font-instrument text-theme-sm text-[#6B6560] dark:text-gray-400">No hay permisos disponibles</p>
            </div>
            } @else {
            <div class="rounded-xl border border-[#E8D9A0] dark:border-[#4A474D] overflow-hidden">
              @for (group of permissionGroups(); track group.module) {
              <div class="border-b border-[#E8D9A0] dark:border-[#4A474D] last:border-0">
                <!-- Module header -->
                <button type="button" (click)="toggleGroup(group.module)"
                  class="w-full flex items-center justify-between px-4 py-3 bg-[#FBF0C9]/40 dark:bg-[#3a383d] hover:bg-[#FBF0C9]/70 dark:hover:bg-[#4A474D] transition-colors">
                  <div class="flex items-center gap-2">
                    <span class="font-instrument text-theme-xs font-bold uppercase tracking-wider text-[#9A6F0A] dark:text-[#E8C97A]">
                      {{getModuleLabel(group.module)}}
                    </span>
                    <span class="font-instrument text-[10px] font-medium text-[#6B6560] dark:text-gray-400">
                      ({{getGroupSelectedCount(group.module)}}/{{group.permissions.length}})
                    </span>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    class="text-[#9A6F0A] dark:text-[#E8C97A] transition-transform"
                    [ngClass]="isGroupOpen(group.module) ? 'rotate-180' : ''">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <!-- Permissions list -->
                @if (isGroupOpen(group.module)) {
                <div class="divide-y divide-[#E8D9A0]/50 dark:divide-[#4A474D]/50">
                  @for (permission of group.permissions; track getPermissionId(permission)) {
                  <label class="flex items-start gap-3 px-4 py-2.5 cursor-pointer hover:bg-[#FBF0C9]/20 dark:hover:bg-white/5 transition-colors">
                    <div class="relative mt-0.5 shrink-0">
                      <input type="checkbox"
                        [value]="getPermissionId(permission)"
                        (change)="onPermissionChange(getPermissionId(permission), $event)"
                        [checked]="isPermissionSelected(getPermissionId(permission))"
                        class="sr-only peer">
                      <div class="w-4 h-4 rounded border-2 border-[#E8D9A0] dark:border-[#4A474D] bg-white dark:bg-[#3a383d] peer-checked:bg-[#C69214] peer-checked:border-[#C69214] transition-all flex items-center justify-center">
                        <svg *ngIf="isPermissionSelected(getPermissionId(permission))" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-instrument text-theme-sm font-medium text-[#191817] dark:text-white">{{permission.name}}</p>
                      <p class="font-instrument text-theme-xs text-[#6B6560] dark:text-gray-400">{{permission.description}}</p>
                      <span class="inline-flex items-center mt-1 rounded px-1.5 py-0.5 font-instrument text-[10px] font-medium"
                        [ngClass]="getActionBadgeClass(permission.action)">
                        {{getActionLabel(permission.action)}}
                      </span>
                    </div>
                  </label>
                  }
                </div>
                }
              </div>
              }
            </div>
            }
            @if (roleForm.get('permissions')?.invalid && roleForm.get('permissions')?.touched) {
            <p class="mt-1 font-instrument text-theme-xs text-error-600 dark:text-error-400">Selecciona al menos un permiso</p>
            }
          </div>

        </form>
      </div>

      <!-- Footer actions -->
      <div class="border-t border-[#E8D9A0] dark:border-[#4A474D] px-5 py-4 shrink-0 bg-white dark:bg-[#232126]">
        <div class="flex gap-3">
          <button type="button" (click)="onCancel()"
            class="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[#E8D9A0] bg-white px-5 py-2.5 font-instrument text-sm font-medium text-[#46424A] hover:bg-gray-50 dark:border-[#4A474D] dark:bg-[#3a383d] dark:text-gray-300 dark:hover:bg-white/5 transition-all shadow-theme-sm">
            Cancelar
          </button>
          <button type="submit" (click)="onSubmit()" [disabled]="isLoading"
            class="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#C69214] to-[#FAC600] px-5 py-2.5 font-instrument text-sm font-semibold text-[#191817] dark:text-white shadow-theme-sm transition-all hover:from-[#9A6F0A] hover:to-[#C69214] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
            @if (isLoading) {
            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Guardando...
            } @else {
            {{editMode ? 'Actualizar Rol' : 'Crear Rol'}}
            }
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class RoleFormComponent implements OnInit {
  @Input() role: Role | null = null;
  @Input() editMode = false;
  @Input() isLoading = false;
  @Input() availablePermissions: Permission[] = [];
  @Output() formSubmit = new EventEmitter<Role>();
  @Output() formCancel = new EventEmitter<void>();

  roleForm: FormGroup;
  selectedPermissions: string[] = [];
  openGroups = signal<Set<string>>(new Set());

  permissionGroups = computed(() => {
    const groups = new Map<string, Permission[]>();
    for (const p of this.availablePermissions) {
      const mod = p.module || 'general';
      if (!groups.has(mod)) groups.set(mod, []);
      groups.get(mod)!.push(p);
    }
    return Array.from(groups.entries()).map(([module, permissions]) => ({ module, permissions }));
  });

  constructor(private fb: FormBuilder) {
    this.roleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      permissions: [[], Validators.required],
      isActive: [true],
      isGlobal: [false]
    });
  }

  ngOnInit() {
    // Open all groups by default
    const allModules = new Set(this.availablePermissions.map(p => p.module || 'general'));
    this.openGroups.set(allModules);

    if (this.role && this.editMode) {
      this.selectedPermissions = this.role.permissions
        .map(p => typeof p === 'string' ? p : this.getPermissionId(p as Permission))
        .filter((id): id is string => !!id);

      this.roleForm.patchValue({
        ...this.role,
        permissions: this.selectedPermissions,
        isGlobal: !(this.role as any).sucursalId
      });
    }
  }

  toggleGroup(module: string) {
    const current = new Set(this.openGroups());
    if (current.has(module)) current.delete(module);
    else current.add(module);
    this.openGroups.set(current);
  }

  isGroupOpen(module: string): boolean {
    return this.openGroups().has(module);
  }

  getGroupSelectedCount(module: string): number {
    const group = this.permissionGroups().find(g => g.module === module);
    if (!group) return 0;
    return group.permissions.filter(p => this.isPermissionSelected(this.getPermissionId(p))).length;
  }

  getPermissionId(permission: Permission): string {
    return permission.id || (permission as any)._id || '';
  }

  onPermissionChange(permissionId: string, event: any) {
    if (event.target.checked) {
      if (!this.selectedPermissions.includes(permissionId)) this.selectedPermissions.push(permissionId);
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(id => id !== permissionId);
    }
    this.roleForm.patchValue({ permissions: this.selectedPermissions });
  }

  isPermissionSelected(permissionId: string): boolean {
    return this.selectedPermissions.includes(permissionId);
  }

  getModuleLabel(module: string): string {
    const labels: Record<string, string> = {
      users: 'Usuarios', products: 'Productos', orders: 'Órdenes',
      providers: 'Proveedores', organizations: 'Organizaciones',
      reports: 'Reportes', admin: 'Administración', general: 'General'
    };
    return labels[module] || module;
  }

  getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      create: 'Crear', read: 'Leer', update: 'Actualizar',
      delete: 'Eliminar', list: 'Listar', export: 'Exportar', import: 'Importar'
    };
    return labels[action] || action;
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

  onSubmit() {
    if (this.roleForm.valid) {
      const validPermissions = this.selectedPermissions.filter(id =>
        this.availablePermissions.some(p => this.getPermissionId(p) === id)
      );
      const formValue = this.roleForm.value;
      const roleData: any = {
        name: formValue.name,
        description: formValue.description,
        permissions: validPermissions,
        isActive: formValue.isActive,
        id: this.editMode && this.role?.id ? this.role.id : undefined,
        ...(formValue.isGlobal ? { sucursalId: null } : {})
      };
      this.formSubmit.emit(roleData);
    } else {
      Object.keys(this.roleForm.controls).forEach(key => this.roleForm.get(key)?.markAsTouched());
    }
  }

  onCancel() {
    this.formCancel.emit();
    this.roleForm.reset();
    this.selectedPermissions = [];
  }
}
