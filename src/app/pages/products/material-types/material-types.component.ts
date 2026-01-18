import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProviderService } from '../../../shared/services/provider.service';
import { ToastService } from '../../../shared/services/toast.service';
import { MaterialType } from '../../../shared/interfaces/provider.interfaces';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-material-types',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './material-types.component.html'
})
export class MaterialTypesComponent implements OnInit {
    private providerService = inject(ProviderService);
    private toastService = inject(ToastService);
    private fb = inject(FormBuilder);

    materialTypes = signal<MaterialType[]>([]);
    loading = signal(false);
    showModal = signal(false);
    editingType = signal<MaterialType | null>(null);

    // New Signal for conditional validators
    isGold = signal(false);

    materialForm: FormGroup;

    readonly materialTypeOptions = [
        { value: 'oro', label: 'Oro' },
        { value: 'plata', label: 'Plata' },
        { value: 'laminado', label: 'Laminado' }
    ];

    readonly karatOptions = [
        { value: 10, label: '10k' },
        { value: 14, label: '14k' },
        { value: 18, label: '18k' }
    ];

    constructor() {
        this.materialForm = this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(50)]],
            code: ['', [Validators.required, Validators.maxLength(10)]],
            type: ['', Validators.required],
            karat: [null],
            description: ['', Validators.maxLength(200)],
            status: ['active']
        });

        // Listen to type changes to toggle karat validation
        this.materialForm.get('type')?.valueChanges.subscribe(value => {
            const isGold = value === 'oro';
            this.isGold.set(isGold);

            const karatControl = this.materialForm.get('karat');
            if (isGold) {
                karatControl?.setValidators([Validators.required]);
            } else {
                karatControl?.clearValidators();
                karatControl?.setValue(null);
            }
            karatControl?.updateValueAndValidity();
        });
    }

    ngOnInit() {
        this.loadMaterialTypes();
    }

    loadMaterialTypes() {
        this.loading.set(true);
        // Fetch all types including global ones
        this.providerService.getMaterialTypes()
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (res) => {
                    if (res.success) {
                        this.materialTypes.set(res.data);
                    }
                },
                error: (err) => {
                    console.error('Error loading material types', err);
                    this.toastService.error('Error al cargar tipos de material');
                }
            });
    }

    openCreateModal() {
        this.editingType.set(null);
        this.materialForm.reset({ status: 'active' });
        this.showModal.set(true);
    }

    openEditModal(type: MaterialType) {
        this.editingType.set(type);
        this.materialForm.patchValue({
            name: type.name,
            code: type.code,
            type: type.type,
            karat: type.karat,
            description: type.description,
            status: type.status
        });
        this.showModal.set(true);
    }

    closeModal() {
        this.showModal.set(false);
        this.editingType.set(null);
        this.materialForm.reset();
    }

    saveType() {
        if (this.materialForm.invalid) {
            this.materialForm.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        const formData = this.materialForm.value;

        const request = this.editingType()
            ? this.providerService.updateMaterialType(this.editingType()!.id!, formData)
            : this.providerService.createMaterialType(formData);

        request
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (res) => {
                    if (res.success) {
                        this.toastService.success(
                            this.editingType()
                                ? 'Tipo de material actualizado'
                                : 'Tipo de material creado'
                        );
                        this.closeModal();
                        this.loadMaterialTypes();
                    }
                },
                error: (err) => {
                    console.error('Error saving material type', err);
                    this.toastService.error('Error al guardar tipo de material');
                }
            });
    }

    deleteType(type: MaterialType) {
        if (!confirm(`¿Estás seguro de eliminar el tipo "${type.name}"?`)) return;

        this.loading.set(true);
        this.providerService.deleteMaterialType(type.id!)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (res) => {
                    if (res.success) {
                        this.toastService.success('Tipo de material eliminado');
                        this.loadMaterialTypes();
                    }
                },
                error: (err) => {
                    console.error('Error deleting material type', err);
                    this.toastService.error('Error al eliminar tipo de material');
                }
            });
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.materialForm.get(fieldName);
        return !!(field && field.invalid && field.touched);
    }

    getFieldError(fieldName: string): string {
        const field = this.materialForm.get(fieldName);
        if (field?.errors) {
            if (field.errors['required']) return 'Este campo es requerido';
            if (field.errors['maxlength']) return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
        }
        return '';
    }
}
