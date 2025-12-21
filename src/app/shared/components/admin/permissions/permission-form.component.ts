import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LabelComponent } from '../../form/label/label.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { SelectComponent } from '../../form/select/select.component';
import { ComponentCardComponent } from '../../common/component-card/component-card.component';
import { Permission } from '../../../interfaces/auth.interfaces';

@Component({
  selector: 'app-permission-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ComponentCardComponent,
    LabelComponent,
    InputFieldComponent,
    SelectComponent,
  ],
  template: `
    <app-component-card title="Formulario de Permisos" desc="Crear o editar permisos del sistema">
      <form [formGroup]="permissionForm" (ngSubmit)="onSubmit()" class="space-y-6">
        <div>
          <app-label for="name">Nombre del Permiso</app-label>
          <app-input-field 
            type="text" 
            id="name" 
            formControlName="name"
            placeholder="Ej: CREATE_USER, READ_PRODUCTS"
            [className]="getFieldClass('name')"
          />
          @if (permissionForm.get('name')?.invalid && permissionForm.get('name')?.touched) {
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">
              El nombre del permiso es requerido
            </p>
          }
        </div>

        <div>
          <app-label for="description">Descripción</app-label>
          <app-input-field 
            type="text" 
            id="description" 
            formControlName="description"
            placeholder="Descripción detallada del permiso"
            [className]="getFieldClass('description')"
          />
          @if (permissionForm.get('description')?.invalid && permissionForm.get('description')?.touched) {
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">
              La descripción es requerida
            </p>
          }
        </div>

        <div>
          <app-label>Módulo</app-label>
          <app-select
            [options]="moduleOptions"
            placeholder="Seleccionar módulo"
            [value]="permissionForm.get('module')?.value"
            (valueChange)="onModuleChange($event)"
            [className]="getSelectClass('module')"
          />
          @if (permissionForm.get('module')?.invalid && permissionForm.get('module')?.touched) {
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">
              El módulo es requerido
            </p>
          }
        </div>

        <div>
          <app-label>Acción</app-label>
          <app-select
            [options]="actionOptions"
            placeholder="Seleccionar acción"
            [value]="permissionForm.get('action')?.value"
            (valueChange)="onActionChange($event)"
            [className]="getSelectClass('action')"
          />
          @if (permissionForm.get('action')?.invalid && permissionForm.get('action')?.touched) {
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">
              La acción es requerida
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
          <app-label for="isActive" className="mb-0">Permiso Activo</app-label>
        </div>

        <div class="flex gap-4 pt-4">
          <button
            type="submit"
            [disabled]="permissionForm.invalid || isLoading"
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
              {{ editMode ? 'Actualizar' : 'Crear' }} Permiso
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
export class PermissionFormComponent {
  @Input() permission: Permission | null = null;
  @Input() editMode = false;
  @Input() isLoading = false;
  @Output() formSubmit = new EventEmitter<Permission>();
  @Output() formCancel = new EventEmitter<void>();

  @Input() set availableModules(modules: string[]) {
    this.moduleOptions = modules.map(m => ({
      value: m,
      label: m.charAt(0).toUpperCase() + m.slice(1) // Capitalize first letter
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

  onModuleChange(value: string) {
    this.permissionForm.patchValue({ module: value });
  }

  onActionChange(value: string) {
    this.permissionForm.patchValue({ action: value });
  }

  getFieldClass(fieldName: string): string {
    const field = this.permissionForm.get(fieldName);
    if (!field) return '';

    if (field.invalid && field.touched) {
      return 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600';
    }
    return '';
  }

  getSelectClass(fieldName: string): string {
    const field = this.permissionForm.get(fieldName);
    if (!field) return 'dark:bg-dark-900';

    if (field.invalid && field.touched) {
      return 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:bg-dark-900';
    }
    return 'dark:bg-dark-900';
  }

  onSubmit() {
    if (this.permissionForm.valid) {
      const permissionData: Permission = {
        ...this.permissionForm.value,
        id: this.editMode && this.permission?.id ? this.permission.id : Date.now().toString()
      };
      this.formSubmit.emit(permissionData);
    } else {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.permissionForm.controls).forEach(key => {
        this.permissionForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel() {
    this.formCancel.emit();
    this.permissionForm.reset();
  }
}