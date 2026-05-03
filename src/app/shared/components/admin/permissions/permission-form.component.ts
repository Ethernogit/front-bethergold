import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Permission } from '../../../interfaces/auth.interfaces';

@Component({
  selector: 'app-permission-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Backdrop -->
    <div class="fixed inset-0 z-[9998] bg-[#191817]/60 backdrop-blur-sm" (click)="onCancel()"></div>

    <!-- Panel -->
    <div class="fixed inset-y-0 right-0 z-[9999] flex w-full max-w-md flex-col bg-white shadow-2xl dark:bg-[#232126]">
      <!-- Header -->
      <div class="border-b border-[#E8D9A0] dark:border-[#4A474D] px-5 py-4 shrink-0">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-instrument text-theme-xl font-semibold text-[#191817] dark:text-white">
              {{editMode ? 'Editar Permiso' : 'Nuevo Permiso'}}
            </h2>
            <p class="font-instrument text-theme-xs text-[#6B6560] dark:text-gray-400 mt-0.5">
              {{editMode ? 'Modifica los datos del permiso.' : 'Define un nuevo permiso del sistema.'}}
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

      <!-- Form body -->
      <div class="flex-1 overflow-y-auto p-5">
        <form [formGroup]="permissionForm" (ngSubmit)="onSubmit()" class="space-y-5">

          <!-- Name -->
          <div>
            <label class="mb-1.5 block font-instrument text-theme-sm font-medium text-[#46424A] dark:text-gray-300">
              Nombre <span class="text-error-500">*</span>
            </label>
            <input type="text" formControlName="name" placeholder="Ej: CREATE_USER, READ_PRODUCTS"
              class="w-full rounded-xl border bg-white px-4 py-2.5 font-instrument text-theme-sm text-[#191817] placeholder-[#6B6560] outline-none transition-all dark:bg-[#3a383d] dark:text-white dark:placeholder-white/40"
              [ngClass]="permissionForm.get('name')?.invalid && permissionForm.get('name')?.touched
                ? 'border-error-400 focus:border-error-500 focus:ring-2 focus:ring-error-500/20'
                : 'border-[#E8D9A0] focus:border-[#C69214] focus:ring-2 focus:ring-[#C69214]/20 dark:border-[#4A474D]'">
            @if (permissionForm.get('name')?.invalid && permissionForm.get('name')?.touched) {
            <p class="mt-1 font-instrument text-theme-xs text-error-600 dark:text-error-400">El nombre es requerido (mín. 3 caracteres)</p>
            }
          </div>

          <!-- Description -->
          <div>
            <label class="mb-1.5 block font-instrument text-theme-sm font-medium text-[#46424A] dark:text-gray-300">
              Descripción <span class="text-error-500">*</span>
            </label>
            <textarea formControlName="description" rows="2" placeholder="Descripción detallada del permiso..."
              class="w-full rounded-xl border bg-white px-4 py-2.5 font-instrument text-theme-sm text-[#191817] placeholder-[#6B6560] outline-none transition-all resize-none dark:bg-[#3a383d] dark:text-white dark:placeholder-white/40"
              [ngClass]="permissionForm.get('description')?.invalid && permissionForm.get('description')?.touched
                ? 'border-error-400 focus:border-error-500 focus:ring-2 focus:ring-error-500/20'
                : 'border-[#E8D9A0] focus:border-[#C69214] focus:ring-2 focus:ring-[#C69214]/20 dark:border-[#4A474D]'"></textarea>
            @if (permissionForm.get('description')?.invalid && permissionForm.get('description')?.touched) {
            <p class="mt-1 font-instrument text-theme-xs text-error-600 dark:text-error-400">La descripción es requerida (mín. 10 caracteres)</p>
            }
          </div>

          <!-- Module -->
          <div>
            <label class="mb-1.5 block font-instrument text-theme-sm font-medium text-[#46424A] dark:text-gray-300">
              Módulo <span class="text-error-500">*</span>
            </label>
            <select formControlName="module"
              class="w-full rounded-xl border bg-white px-4 py-2.5 font-instrument text-theme-sm text-[#191817] outline-none transition-all dark:bg-[#3a383d] dark:text-white"
              [ngClass]="permissionForm.get('module')?.invalid && permissionForm.get('module')?.touched
                ? 'border-error-400 focus:border-error-500 focus:ring-2 focus:ring-error-500/20'
                : 'border-[#E8D9A0] focus:border-[#C69214] focus:ring-2 focus:ring-[#C69214]/20 dark:border-[#4A474D]'">
              <option value="" disabled>Seleccionar módulo</option>
              @for (opt of moduleOptions; track opt.value) {
              <option [value]="opt.value" class="dark:bg-[#232126]">{{opt.label}}</option>
              }
            </select>
            @if (permissionForm.get('module')?.invalid && permissionForm.get('module')?.touched) {
            <p class="mt-1 font-instrument text-theme-xs text-error-600 dark:text-error-400">El módulo es requerido</p>
            }
          </div>

          <!-- Action -->
          <div>
            <label class="mb-1.5 block font-instrument text-theme-sm font-medium text-[#46424A] dark:text-gray-300">
              Acción <span class="text-error-500">*</span>
            </label>
            <div class="grid grid-cols-2 gap-2">
              @for (opt of actionOptions; track opt.value) {
              <label class="cursor-pointer">
                <input type="radio" formControlName="action" [value]="opt.value" class="sr-only peer">
                <div class="rounded-xl border px-3 py-2.5 font-instrument text-theme-sm font-medium text-center transition-all peer-checked:border-[#C69214] peer-checked:bg-[#FBF0C9] peer-checked:text-[#9A6F0A] dark:peer-checked:border-[#C69214] dark:peer-checked:bg-[#4A474D] dark:peer-checked:text-[#FAC600] border-[#E8D9A0] text-[#46424A] hover:bg-gray-50 dark:border-[#4A474D] dark:text-gray-300 dark:hover:bg-white/5">
                  {{opt.label}}
                </div>
              </label>
              }
            </div>
            @if (permissionForm.get('action')?.invalid && permissionForm.get('action')?.touched) {
            <p class="mt-1 font-instrument text-theme-xs text-error-600 dark:text-error-400">La acción es requerida</p>
            }
          </div>

          <!-- isActive toggle -->
          <div class="rounded-xl border border-[#E8D9A0] dark:border-[#4A474D] p-4 bg-[#FBF0C9]/20 dark:bg-[#3a383d]">
            <label class="flex items-center gap-3 cursor-pointer">
              <div class="relative">
                <input type="checkbox" formControlName="isActive" class="sr-only peer">
                <div class="w-10 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:bg-[#C69214] transition-colors"></div>
                <div class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
              </div>
              <div>
                <p class="font-instrument text-theme-sm font-medium text-[#191817] dark:text-white">Permiso Activo</p>
                <p class="font-instrument text-theme-xs text-[#6B6560] dark:text-gray-400">El permiso estará disponible para asignar a roles</p>
              </div>
            </label>
          </div>

        </form>
      </div>

      <!-- Footer -->
      <div class="border-t border-[#E8D9A0] dark:border-[#4A474D] px-5 py-4 shrink-0 bg-white dark:bg-[#232126]">
        <div class="flex gap-3">
          <button type="button" (click)="onCancel()"
            class="flex-1 flex items-center justify-center rounded-xl border border-[#E8D9A0] bg-white px-5 py-2.5 font-instrument text-sm font-medium text-[#46424A] hover:bg-gray-50 dark:border-[#4A474D] dark:bg-[#3a383d] dark:text-gray-300 dark:hover:bg-white/5 transition-all shadow-theme-sm">
            Cancelar
          </button>
          <button type="button" (click)="onSubmit()" [disabled]="isLoading"
            class="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#C69214] to-[#FAC600] px-5 py-2.5 font-instrument text-sm font-semibold text-[#191817] dark:text-white shadow-theme-sm transition-all hover:from-[#9A6F0A] hover:to-[#C69214] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
            @if (isLoading) {
            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Guardando...
            } @else {
            {{editMode ? 'Actualizar Permiso' : 'Crear Permiso'}}
            }
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class PermissionFormComponent implements OnInit {
  @Input() permission: Permission | null = null;
  @Input() editMode = false;
  @Input() isLoading = false;
  @Output() formSubmit = new EventEmitter<Permission>();
  @Output() formCancel = new EventEmitter<void>();

  @Input() set availableModules(modules: string[]) {
    this.moduleOptions = modules.map(m => ({
      value: m,
      label: this.getModuleLabel(m)
    }));
  }

  permissionForm: FormGroup;
  moduleOptions: { value: string; label: string }[] = [];

  actionOptions = [
    { value: 'create', label: 'Crear' },
    { value: 'read', label: 'Leer' },
    { value: 'update', label: 'Actualizar' },
    { value: 'delete', label: 'Eliminar' },
    { value: 'list', label: 'Listar' },
    { value: 'export', label: 'Exportar' },
    { value: 'import', label: 'Importar' },
    { value: 'approve', label: 'Aprobar' },
  ];

  constructor(private fb: FormBuilder) {
    this.permissionForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      module: ['', Validators.required],
      action: ['', Validators.required],
      isActive: [true]
    });
  }

  ngOnInit() {
    if (this.permission && this.editMode) {
      this.permissionForm.patchValue(this.permission);
    }
  }

  private getModuleLabel(module: string): string {
    const labels: Record<string, string> = {
      users: 'Usuarios', roles: 'Roles', permissions: 'Permisos', products: 'Productos',
      orders: 'Órdenes', inventory: 'Inventario', sales: 'Ventas', reports: 'Reportes',
      settings: 'Configuraciones', analytics: 'Analíticas', payments: 'Pagos',
      customers: 'Clientes', suppliers: 'Proveedores', auth: 'Autenticación',
      admin: 'Administración', organization: 'Organización', categories: 'Categorías',
      sucursales: 'Sucursales', notifications: 'Notificaciones',
    };
    return labels[module] || module.charAt(0).toUpperCase() + module.slice(1);
  }

  onSubmit() {
    if (this.permissionForm.valid) {
      const data: Permission = {
        ...this.permissionForm.value,
        id: this.editMode && this.permission?.id ? this.permission.id : undefined
      };
      this.formSubmit.emit(data);
    } else {
      Object.keys(this.permissionForm.controls).forEach(key => this.permissionForm.get(key)?.markAsTouched());
    }
  }

  onCancel() {
    this.formCancel.emit();
    this.permissionForm.reset();
  }
}
