import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { LabelComponent } from '../../form/label/label.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { ComponentCardComponent } from '../../common/component-card/component-card.component';
import { Permission, Role } from '../../../interfaces/auth.interfaces';

@Component({
  selector: 'app-role-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ComponentCardComponent,
    LabelComponent,
    InputFieldComponent,
  ],
  template: `
    <app-component-card title="Formulario de Roles" desc="Crear o editar roles del sistema">
      <form [formGroup]="roleForm" (ngSubmit)="onSubmit()" class="space-y-6">
        <div>
          <app-label for="name">Nombre del Rol</app-label>
          <app-input-field 
            type="text" 
            id="name" 
            formControlName="name"
            placeholder="Ej: Administrador, Editor, Viewer"
            [className]="getFieldClass('name')"
          />
          @if (roleForm.get('name')?.invalid && roleForm.get('name')?.touched) {
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">
              El nombre del rol es requerido
            </p>
          }
        </div>

        <div>
          <app-label for="description">Descripción</app-label>
          <app-input-field 
            type="text" 
            id="description" 
            formControlName="description"
            placeholder="Descripción detallada del rol"
            [className]="getFieldClass('description')"
          />
          @if (roleForm.get('description')?.invalid && roleForm.get('description')?.touched) {
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">
              La descripción es requerida
            </p>
          }
        </div>

        <div>
          <app-label>Permisos</app-label>
          <div class="mt-2 max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-4">
            @if (availablePermissions.length === 0) {
              <p class="text-gray-500 dark:text-gray-400 text-sm">No hay permisos disponibles</p>
            } @else {
              <div class="space-y-3">
                @for (permission of availablePermissions; track permission.id) {
                  <label class="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      [value]="permission.id"
                      (change)="onPermissionChange(permission.id, $event)"
                      [checked]="isPermissionSelected(permission.id)"
                      class="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
                    />
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ permission.name }}
                      </div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">
                        {{ permission.description }}
                      </div>
                      <div class="flex gap-2 mt-1">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                              [ngClass]="getModuleBadgeClass(permission.module)">
                          {{ getModuleLabel(permission.module) }}
                        </span>
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                              [ngClass]="getActionBadgeClass(permission.action)">
                          {{ getActionLabel(permission.action) }}
                        </span>
                      </div>
                    </div>
                  </label>
                }
              </div>
            }
          </div>
          @if (roleForm.get('permissions')?.invalid && roleForm.get('permissions')?.touched) {
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">
              Debe seleccionar al menos un permiso
            </p>
          }
        </div>

        <div class="flex items-center space-x-3">
          <input
            type="checkbox"
            id="isActive"
            formControlName="isActive"
            class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
          />
          <app-label for="isActive" className="mb-0">Rol Activo</app-label>
        </div>

        <div class="flex gap-4 pt-4">
          <button
            type="submit"
            [disabled]="roleForm.invalid || isLoading"
            class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
          >
            @if (isLoading) {
              <span class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </span>
            } @else {
              {{ editMode ? 'Actualizar' : 'Crear' }} Rol
            }
          </button>
          <button
            type="button"
            (click)="onCancel()"
            class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Cancelar
          </button>
        </div>
      </form>
    </app-component-card>
  `,
  styles: ``
})
export class RoleFormComponent {
  @Input() role: Role | null = null;
  @Input() editMode = false;
  @Input() isLoading = false;
  @Input() availablePermissions: Permission[] = [];
  @Output() formSubmit = new EventEmitter<Role>();
  @Output() formCancel = new EventEmitter<void>();

  roleForm: FormGroup;
  selectedPermissions: string[] = [];

  constructor(private fb: FormBuilder) {
    this.roleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      permissions: [[], Validators.required],
      isActive: [true]
    });
  }

  ngOnInit() {
    if (this.role && this.editMode) {
      this.selectedPermissions = this.role.permissions.map(p => 
        typeof p === 'string' ? p : p.id
      );
      this.roleForm.patchValue({
        ...this.role,
        permissions: this.role.permissions
      });
    }
  }

  onPermissionChange(permissionId: string, event: any) {
    if (event.target.checked) {
      this.selectedPermissions.push(permissionId);
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(id => id !== permissionId);
    }
    this.roleForm.patchValue({ permissions: this.selectedPermissions });
  }

  isPermissionSelected(permissionId: string): boolean {
    return this.selectedPermissions.includes(permissionId);
  }

  getFieldClass(fieldName: string): string {
    const field = this.roleForm.get(fieldName);
    if (!field) return '';
    
    if (field.invalid && field.touched) {
      return 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600';
    }
    return '';
  }

  getModuleLabel(module: string): string {
    const labels: { [key: string]: string } = {
      'users': 'Usuarios',
      'products': 'Productos',
      'orders': 'Órdenes',
      'providers': 'Proveedores',
      'organizations': 'Organizaciones',
      'reports': 'Reportes',
      'admin': 'Administración'
    };
    return labels[module] || module;
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
      'products': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'orders': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'providers': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'organizations': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      'reports': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
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

  onSubmit() {
    if (this.roleForm.valid) {
      const roleData: Role = {
        ...this.roleForm.value,
        id: this.editMode && this.role?.id ? this.role.id : Date.now().toString()
      };
      this.formSubmit.emit(roleData);
    } else {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.roleForm.controls).forEach(key => {
        this.roleForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel() {
    this.formCancel.emit();
    this.roleForm.reset();
    this.selectedPermissions = [];
  }
}